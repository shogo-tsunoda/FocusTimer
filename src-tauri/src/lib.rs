mod settings;
mod timer;

use std::path::PathBuf;
use std::sync::Arc;
use tauri::{
    AppHandle, Emitter, Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
use tokio::sync::Mutex;

struct AppState {
    timer: timer::TimerHandle,
    settings: Arc<Mutex<settings::Settings>>,
    data_dir: PathBuf,
}

// ─── Tauri Commands ───────────────────────────────────────────

#[tauri::command]
async fn get_snapshot(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<timer::TimerSnapshot, ()> {
    let app = state.lock().await;
    let snap = app.timer.snapshot.lock().await.clone();
    Ok(snap)
}

#[tauri::command]
async fn get_settings(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<settings::Settings, ()> {
    let app = state.lock().await;
    let s = app.settings.lock().await.clone();
    Ok(s)
}

#[tauri::command]
async fn save_settings(
    new_settings: settings::Settings,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
    app_handle: AppHandle,
) -> Result<(), ()> {
    let (data_dir, timer_ref) = {
        let app = state.lock().await;
        (app.data_dir.clone(), app.timer.tx.clone())
    };

    // Apply timer settings
    let _ = timer_ref
        .send(timer::TimerCommand::ApplySettings {
            focus_secs: new_settings.focus_minutes * 60,
            break_secs: new_settings.break_minutes * 60,
            long_break_secs: new_settings.long_break_minutes * 60,
            sessions: new_settings.sessions,
            long_break_interval: new_settings.long_break_interval,
            auto_start_break: new_settings.auto_start_break,
            auto_start_focus: new_settings.auto_start_focus,
        })
        .await;

    // Apply always-on-top
    if let Some(win) = app_handle.get_webview_window("main") {
        let _ = win.set_always_on_top(new_settings.always_on_top);
    }

    settings::save(&data_dir, &new_settings);

    let app = state.lock().await;
    let mut s = app.settings.lock().await;
    *s = new_settings;
    Ok(())
}

#[tauri::command]
async fn timer_start(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<(), ()> {
    let app = state.lock().await;
    app.timer.send(timer::TimerCommand::Start).await;
    Ok(())
}

#[tauri::command]
async fn timer_pause(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<(), ()> {
    let app = state.lock().await;
    app.timer.send(timer::TimerCommand::Pause).await;
    Ok(())
}

#[tauri::command]
async fn timer_resume(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<(), ()> {
    let app = state.lock().await;
    app.timer.send(timer::TimerCommand::Resume).await;
    Ok(())
}

#[tauri::command]
async fn timer_reset(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<(), ()> {
    let app = state.lock().await;
    app.timer.send(timer::TimerCommand::Reset).await;
    Ok(())
}

#[tauri::command]
async fn timer_skip(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<(), ()> {
    let app = state.lock().await;
    app.timer.send(timer::TimerCommand::Skip).await;
    Ok(())
}

#[tauri::command]
async fn set_task_name(
    name: String,
    state: tauri::State<'_, Arc<Mutex<AppState>>>,
) -> Result<(), ()> {
    let app = state.lock().await;
    // Persist task name in settings
    let mut s = app.settings.lock().await;
    s.task_name = name.clone();
    let data_dir = app.data_dir.clone();
    settings::save(&data_dir, &s);
    drop(s);
    app.timer.send(timer::TimerCommand::SetTaskName(name)).await;
    Ok(())
}

#[tauri::command]
async fn window_drag(app_handle: AppHandle) -> Result<(), ()> {
    if let Some(win) = app_handle.get_webview_window("main") {
        let _ = win.start_dragging();
    }
    Ok(())
}

// ─── App Entry ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));

            let loaded = settings::load(&data_dir);

            // Apply always-on-top from saved settings
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_always_on_top(loaded.always_on_top);
            }

            let (handle, mut snap_rx) = timer::spawn(loaded.clone());

            let app_state = Arc::new(Mutex::new(AppState {
                timer: handle,
                settings: Arc::new(Mutex::new(loaded)),
                data_dir,
            }));

            app.manage(app_state.clone());

            // Background task: forward timer snapshots to frontend
            let app_handle = app.handle().clone();
            tokio::spawn(async move {
                while let Some(snap) = snap_rx.recv().await {
                    let _ = app_handle.emit("timer-tick", &snap);
                }
            });

            // Window close button → hide to tray (quit via tray menu)
            let handle_for_close = app.handle().clone();
            let state_for_close = app_state.clone();
            if let Some(win) = app.get_webview_window("main") {
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        let minimize = state_for_close
                            .try_lock()
                            .ok()
                            .and_then(|s| s.settings.try_lock().ok().map(|s| s.minimize_to_tray))
                            .unwrap_or(true);

                        if minimize {
                            api.prevent_close();
                            if let Some(w) = handle_for_close.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                    }
                });
            }

            // Setup tray
            let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "表示", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // Load tray icon (embed PNG bytes at compile time)
            let tray_icon = tauri::image::Image::from_bytes(
                include_bytes!("../icons/32x32.png")
            )?;

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .tooltip("FocusTimer")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_snapshot,
            get_settings,
            save_settings,
            timer_start,
            timer_pause,
            timer_resume,
            timer_reset,
            timer_skip,
            set_task_name,
            window_drag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
