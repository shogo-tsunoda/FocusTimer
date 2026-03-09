use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, Mutex};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionKind {
    Focus,
    ShortBreak,
    LongBreak,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RunState {
    Idle,
    Running,
    Paused,
}

/// Snapshot sent to the frontend every second (or on state change).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerSnapshot {
    pub kind: SessionKind,
    pub run_state: RunState,
    pub seconds_left: u32,
    pub total_seconds: u32,
    pub current_session: u32,
    pub focus_count: u32,
    pub today_sessions: u32,
    pub today_focus_seconds: u32,
    pub task_name: String,
    /// Notification to show once per trigger
    pub notify: Option<String>,
}

pub enum TimerCommand {
    Start,
    Pause,
    Resume,
    Reset,
    Skip,
    SetTaskName(String),
    ApplySettings {
        focus_secs: u32,
        break_secs: u32,
        long_break_secs: u32,
        sessions: u32,
        long_break_interval: u32,
        auto_start_break: bool,
        auto_start_focus: bool,
    },
}

struct Core {
    kind: SessionKind,
    run_state: RunState,
    seconds_left: u32,
    total_seconds: u32,
    current_session: u32,
    focus_count: u32,
    today_sessions: u32,
    today_focus_seconds: u32,
    task_name: String,
    // settings
    focus_secs: u32,
    break_secs: u32,
    long_break_secs: u32,
    sessions: u32,
    long_break_interval: u32,
    auto_start_break: bool,
    auto_start_focus: bool,
    // tracking
    run_start: Option<Instant>,
    paused_remaining: Option<u32>,
}

impl Core {
    fn new(
        focus_secs: u32,
        break_secs: u32,
        long_break_secs: u32,
        sessions: u32,
        long_break_interval: u32,
        auto_start_break: bool,
        auto_start_focus: bool,
    ) -> Self {
        Self {
            kind: SessionKind::Focus,
            run_state: RunState::Idle,
            seconds_left: focus_secs,
            total_seconds: focus_secs,
            current_session: 1,
            focus_count: 0,
            today_sessions: 0,
            today_focus_seconds: 0,
            task_name: String::new(),
            focus_secs,
            break_secs,
            long_break_secs,
            sessions,
            long_break_interval,
            auto_start_break,
            auto_start_focus,
            run_start: None,
            paused_remaining: None,
        }
    }

    fn snapshot(&self, notify: Option<String>) -> TimerSnapshot {
        TimerSnapshot {
            kind: self.kind,
            run_state: self.run_state,
            seconds_left: self.seconds_left,
            total_seconds: self.total_seconds,
            current_session: self.current_session,
            focus_count: self.focus_count,
            today_sessions: self.today_sessions,
            today_focus_seconds: self.today_focus_seconds,
            task_name: self.task_name.clone(),
            notify,
        }
    }

    /// Called every second while running. Returns snapshot (with optional notification).
    fn tick(&mut self) -> (TimerSnapshot, bool) {
        if self.run_state != RunState::Running {
            return (self.snapshot(None), false);
        }

        // Track focus time
        if self.kind == SessionKind::Focus {
            self.today_focus_seconds += 1;
        }

        if self.seconds_left > 0 {
            self.seconds_left -= 1;
        }

        if self.seconds_left == 0 {
            let notify = self.advance_session();
            let snap = self.snapshot(Some(notify));
            return (snap, true);
        }

        (self.snapshot(None), false)
    }

    /// Advance to the next session. Returns notification message.
    fn advance_session(&mut self) -> String {
        let msg;
        match self.kind {
            SessionKind::Focus => {
                self.focus_count += 1;
                self.today_sessions += 1;
                msg = "集中タイム終了！".to_string();

                // Determine next break kind
                let is_long = self.long_break_interval > 0
                    && self.focus_count % self.long_break_interval == 0;

                if is_long {
                    self.kind = SessionKind::LongBreak;
                    self.total_seconds = self.long_break_secs;
                } else {
                    self.kind = SessionKind::ShortBreak;
                    self.total_seconds = self.break_secs;
                }
                self.seconds_left = self.total_seconds;

                if self.auto_start_break {
                    self.run_start = Some(Instant::now());
                } else {
                    self.run_state = RunState::Idle;
                }
            }
            SessionKind::ShortBreak | SessionKind::LongBreak => {
                msg = "休憩終了！集中しましょう。".to_string();

                // Advance session counter
                if self.current_session < self.sessions {
                    self.current_session += 1;
                } else {
                    self.current_session = 1;
                }
                self.kind = SessionKind::Focus;
                self.total_seconds = self.focus_secs;
                self.seconds_left = self.total_seconds;

                if self.auto_start_focus {
                    self.run_start = Some(Instant::now());
                } else {
                    self.run_state = RunState::Idle;
                }
            }
        }
        msg
    }

    fn start(&mut self) {
        if self.run_state == RunState::Idle {
            self.run_state = RunState::Running;
            self.run_start = Some(Instant::now());
        }
    }

    fn pause(&mut self) {
        if self.run_state == RunState::Running {
            self.run_state = RunState::Paused;
            self.paused_remaining = Some(self.seconds_left);
        }
    }

    fn resume(&mut self) {
        if self.run_state == RunState::Paused {
            self.run_state = RunState::Running;
            self.run_start = Some(Instant::now());
        }
    }

    fn reset(&mut self) {
        self.run_state = RunState::Idle;
        self.seconds_left = self.total_seconds;
        self.paused_remaining = None;
        self.run_start = None;
    }

    fn skip(&mut self) {
        self.run_state = RunState::Idle;
        self.paused_remaining = None;
        self.run_start = None;
        let _ = self.advance_session();
        // After skip, always go idle regardless of auto-start
        self.run_state = RunState::Idle;
    }

    fn apply_settings(
        &mut self,
        focus_secs: u32,
        break_secs: u32,
        long_break_secs: u32,
        sessions: u32,
        long_break_interval: u32,
        auto_start_break: bool,
        auto_start_focus: bool,
    ) {
        self.focus_secs = focus_secs;
        self.break_secs = break_secs;
        self.long_break_secs = long_break_secs;
        self.sessions = sessions;
        self.long_break_interval = long_break_interval;
        self.auto_start_break = auto_start_break;
        self.auto_start_focus = auto_start_focus;

        // Reset current session with new values
        self.run_state = RunState::Idle;
        self.total_seconds = match self.kind {
            SessionKind::Focus => focus_secs,
            SessionKind::ShortBreak => break_secs,
            SessionKind::LongBreak => long_break_secs,
        };
        self.seconds_left = self.total_seconds;
    }
}

pub struct TimerHandle {
    tx: mpsc::Sender<TimerCommand>,
    pub snapshot: Arc<Mutex<TimerSnapshot>>,
}

impl TimerHandle {
    pub async fn send(&self, cmd: TimerCommand) {
        let _ = self.tx.send(cmd).await;
    }
}

/// Spawn the background timer task. Returns a handle and a receiver for snapshots.
pub fn spawn(
    initial: crate::settings::Settings,
) -> (TimerHandle, mpsc::Receiver<TimerSnapshot>) {
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<TimerCommand>(32);
    let (snap_tx, snap_rx) = mpsc::channel::<TimerSnapshot>(64);

    let initial_snap = TimerSnapshot {
        kind: SessionKind::Focus,
        run_state: RunState::Idle,
        seconds_left: initial.focus_minutes * 60,
        total_seconds: initial.focus_minutes * 60,
        current_session: 1,
        focus_count: 0,
        today_sessions: 0,
        today_focus_seconds: 0,
        task_name: initial.task_name.clone(),
        notify: None,
    };
    let snapshot_arc = Arc::new(Mutex::new(initial_snap.clone()));
    let snapshot_arc_task = Arc::clone(&snapshot_arc);

    tokio::spawn(async move {
        let mut core = Core::new(
            initial.focus_minutes * 60,
            initial.break_minutes * 60,
            initial.long_break_minutes * 60,
            initial.sessions,
            initial.long_break_interval,
            initial.auto_start_break,
            initial.auto_start_focus,
        );
        core.task_name = initial.task_name;

        let mut interval = tokio::time::interval(Duration::from_secs(1));

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if core.run_state == RunState::Running {
                        let (snap, _changed) = core.tick();
                        let mut guard = snapshot_arc_task.lock().await;
                        *guard = snap.clone();
                        drop(guard);
                        let _ = snap_tx.send(snap).await;
                    }
                }
                Some(cmd) = cmd_rx.recv() => {
                    match cmd {
                        TimerCommand::Start => core.start(),
                        TimerCommand::Pause => core.pause(),
                        TimerCommand::Resume => core.resume(),
                        TimerCommand::Reset => core.reset(),
                        TimerCommand::Skip => core.skip(),
                        TimerCommand::SetTaskName(name) => core.task_name = name,
                        TimerCommand::ApplySettings {
                            focus_secs, break_secs, long_break_secs,
                            sessions, long_break_interval, auto_start_break, auto_start_focus,
                        } => {
                            core.apply_settings(
                                focus_secs, break_secs, long_break_secs,
                                sessions, long_break_interval, auto_start_break, auto_start_focus,
                            );
                        }
                    }
                    // Emit updated snapshot after each command
                    let snap = core.snapshot(None);
                    let mut guard = snapshot_arc_task.lock().await;
                    *guard = snap.clone();
                    drop(guard);
                    let _ = snap_tx.send(snap).await;
                }
            }
        }
    });

    (
        TimerHandle {
            tx: cmd_tx,
            snapshot: snapshot_arc,
        },
        snap_rx,
    )
}
