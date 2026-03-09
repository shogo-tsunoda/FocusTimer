use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMessage {
    pub focus: String,
    pub break_msg: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub focus_minutes: u32,
    pub break_minutes: u32,
    pub long_break_minutes: u32,
    pub sessions: u32,
    pub long_break_interval: u32,
    pub auto_start_break: bool,
    pub auto_start_focus: bool,
    pub notifications_enabled: bool,
    pub sound_enabled: bool,
    pub custom_messages: bool,
    pub focus_message: String,
    pub break_message: String,
    pub session_messages: Vec<SessionMessage>,
    pub always_on_top: bool,
    pub minimize_to_tray: bool,
    pub language: String,
    pub dark_mode: bool,
    pub task_name: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            focus_minutes: 25,
            break_minutes: 5,
            long_break_minutes: 15,
            sessions: 4,
            long_break_interval: 4,
            auto_start_break: false,
            auto_start_focus: false,
            notifications_enabled: true,
            sound_enabled: true,
            custom_messages: false,
            focus_message: "集中タイム終了！休憩しましょう。".to_string(),
            break_message: "さあ、始めよう！".to_string(),
            session_messages: vec![
                SessionMessage {
                    focus: "よくできました！休憩しましょう。".to_string(),
                    break_msg: "さあ、始めよう！".to_string(),
                },
                SessionMessage {
                    focus: "この調子で！".to_string(),
                    break_msg: "少しリラックス。".to_string(),
                },
                SessionMessage {
                    focus: "あと少し！".to_string(),
                    break_msg: "いい感じ！".to_string(),
                },
                SessionMessage {
                    focus: "ラストスパート！".to_string(),
                    break_msg: "お疲れさまです！".to_string(),
                },
            ],
            always_on_top: false,
            minimize_to_tray: true,
            language: "ja".to_string(),
            dark_mode: true,
            task_name: String::new(),
        }
    }
}

pub fn load(data_dir: &PathBuf) -> Settings {
    let path = data_dir.join("settings.json");
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
            return settings;
        }
    }
    Settings::default()
}

pub fn save(data_dir: &PathBuf, settings: &Settings) {
    let _ = std::fs::create_dir_all(data_dir);
    let path = data_dir.join("settings.json");
    if let Ok(content) = serde_json::to_string_pretty(settings) {
        let _ = std::fs::write(path, content);
    }
}
