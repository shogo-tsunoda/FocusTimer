import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  ArrowLeft,
  ChevronDown,
  PencilLine,
  Coffee,
  Flame,
  Plus,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// ─── Types ───────────────────────────────────────────────────
type AppScreen = "timer" | "settings";
type SessionKind = "focus" | "short_break" | "long_break";
type RunState = "idle" | "running" | "paused";
type Language = "ja" | "en";

interface TimerSnapshot {
  kind: SessionKind;
  run_state: RunState;
  seconds_left: number;
  total_seconds: number;
  current_session: number;
  focus_count: number;
  today_sessions: number;
  today_focus_seconds: number;
  task_name: string;
  notify: string | null;
}

interface SessionMessage {
  focus: string;
  break_msg: string;
}

interface AppSettings {
  focus_minutes: number;
  break_minutes: number;
  long_break_minutes: number;
  sessions: number;
  long_break_interval: number;
  auto_start_break: boolean;
  auto_start_focus: boolean;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  custom_messages: boolean;
  focus_message: string;
  break_message: string;
  session_messages: SessionMessage[];
  always_on_top: boolean;
  minimize_to_tray: boolean;
  language: Language;
  theme_color: string;
  task_name: string;
}

const DEFAULT_SETTINGS: AppSettings = {
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
  focus_message: "集中タイム終了！休憩しましょう。",
  break_message: "さあ、始めよう！",
  session_messages: [
    { focus: "よくできました！休憩しましょう。", break_msg: "さあ、始めよう！" },
    { focus: "この調子で！", break_msg: "少しリラックス。" },
    { focus: "あと少し！", break_msg: "いい感じ！" },
    { focus: "ラストスパート！", break_msg: "お疲れさまです！" },
  ],
  always_on_top: false,
  minimize_to_tray: true,
  language: "ja",
  theme_color: "#0F1117",
  task_name: "",
};

const LANG = {
  ja: {
    focus: "集中モード",
    break: "休憩モード",
    long_break: "長休憩モード",
    shortBreak: "休憩タイム",
    longBreakLabel: "長休憩タイム",
    session: (c: number, t: number) => `セッション ${c} / ${t}`,
    today: (s: number, m: number) => `今日: ${s}セッション・${m}分集中`,
    settings: "設定",
    timer: "タイマー",
    focusMin: "集中（分）",
    breakMin: "休憩（分）",
    sessions: "セッション数",
    longBreak: "長休憩",
    longBreakLen: "長休憩の長さ（分）",
    longBreakInterval: "間隔（セッションごと）",
    autoStart: "自動開始",
    autoBreak: "休憩を自動開始",
    autoFocus: "集中を自動開始",
    notifications: "通知",
    notifEnabled: "通知",
    notifSound: "通知音",
    customMessages: "メッセージをカスタマイズ",
    focusEndMsg: "集中完了メッセージ",
    breakEndMsg: "休憩完了メッセージ",
    general: "一般",
    alwaysOnTop: "常に手前に表示",
    minimizeToTray: "最小化してトレイに収納",
    language: "言語",
    theme: "テーマ",
    themeCustom: "カスタム",
    save: "保存",
    task_placeholder: "タスク名を入力...",
    notifMsg: "通知メッセージ",
  },
  en: {
    focus: "FOCUS",
    break: "BREAK",
    long_break: "LONG BREAK",
    shortBreak: "Short break",
    longBreakLabel: "Long break",
    session: (c: number, t: number) => `Session ${c} of ${t}`,
    today: (s: number, m: number) => `Today: ${s} sessions · ${m}m focused`,
    settings: "Settings",
    timer: "TIMER",
    focusMin: "Focus (min)",
    breakMin: "Break (min)",
    sessions: "Sessions",
    longBreak: "Long break",
    longBreakLen: "Long break length (min)",
    longBreakInterval: "Interval (per sessions)",
    autoStart: "AUTO START",
    autoBreak: "Auto-start break",
    autoFocus: "Auto-start focus",
    notifications: "NOTIFICATIONS",
    notifEnabled: "Notifications",
    notifSound: "Notification sound",
    customMessages: "Custom messages",
    focusEndMsg: "Focus complete message",
    breakEndMsg: "Break complete message",
    general: "GENERAL",
    alwaysOnTop: "Always on top",
    minimizeToTray: "Minimize to tray",
    language: "Language",
    theme: "Theme",
    themeCustom: "Custom",
    save: "Save",
    task_placeholder: "Enter task name...",
    notifMsg: "NOTIFICATION MESSAGES",
  },
} as const;

const LANG_LABELS: Record<Language, string> = { ja: "日本語", en: "English" };

const THEME_PRESETS = [
  { name: "Dark",     color: "#0F1117" },
  { name: "Navy",     color: "#0A0F1E" },
  { name: "Slate",    color: "#1C2333" },
  { name: "Midnight", color: "#080B14" },
] as const;

// ─── Circular Progress Ring ───────────────────────────────────
function TimerRing({
  progress,
  kind,
}: {
  progress: number;
  kind: SessionKind;
}) {
  const r = 100;
  const stroke = 5;
  const cx = 105;
  const cy = 105;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  const accent =
    kind === "focus" ? "#3B82F6" : "#34D399";
  const glowColor =
    kind === "focus" ? "#3B82F610" : "#34D39910";

  return (
    <svg width="210" height="210" viewBox="0 0 210 210" className="absolute inset-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#242836" strokeWidth={stroke} />
      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      {/* Inner glow */}
      <defs>
        <radialGradient id={`glow-${kind}`}>
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor="#00000000" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={85} ry={85} fill={`url(#glow-${kind})`} />
    </svg>
  );
}

// ─── Toggle ──────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 w-[40px] h-[22px] rounded-full transition-colors ${
        checked ? "bg-[#3B82F6]" : "bg-[#555B6E]"
      }`}
    >
      <span
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

// ─── Settings Row ─────────────────────────────────────────────
function SettingsRow({
  label,
  children,
  small,
}: {
  label: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between w-full h-[40px] px-3 rounded-[8px] bg-[#2A2E3D]">
      <span className={`${small ? "text-[12px]" : "text-[13px]"} text-[#8B91A0]`}>{label}</span>
      {children}
    </div>
  );
}

// ─── Timer Screen ────────────────────────────────────────────
function TimerScreen({
  snapshot,
  settings,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  onTaskNameChange,
  onOpenSettings,
}: {
  snapshot: TimerSnapshot;
  settings: AppSettings;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  onTaskNameChange: (name: string) => void;
  onOpenSettings: () => void;
}) {
  const t = LANG[settings.language];
  const kind = snapshot.kind;
  const isBreak = kind !== "focus";
  const accent = isBreak ? "text-[#34D399]" : "text-[#3B82F6]";
  const accentBg = isBreak ? "bg-[#34D399]" : "bg-[#3B82F6]";
  const accentShadow = isBreak
    ? "shadow-[0_4px_24px_rgba(52,211,153,0.25)]"
    : "shadow-[0_4px_24px_rgba(59,130,246,0.25)]";

  const progress =
    snapshot.total_seconds > 0
      ? snapshot.seconds_left / snapshot.total_seconds
      : 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const modeLabel =
    kind === "focus"
      ? t.focus
      : kind === "short_break"
      ? t.break
      : t.long_break;

  const subLabel =
    kind === "focus"
      ? t.session(snapshot.current_session, settings.sessions)
      : kind === "short_break"
      ? t.shortBreak
      : t.longBreakLabel;

  const todayMinutes = Math.floor(snapshot.today_focus_seconds / 60);

  const [editingTask, setEditingTask] = useState(false);
  const [taskDraft, setTaskDraft] = useState(snapshot.task_name);
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTaskDraft(snapshot.task_name);
  }, [snapshot.task_name]);

  useEffect(() => {
    if (editingTask) taskInputRef.current?.focus();
  }, [editingTask]);

  const commitTask = useCallback(() => {
    setEditingTask(false);
    onTaskNameChange(taskDraft);
  }, [taskDraft, onTaskNameChange]);

  const handlePlayPause = () => {
    if (snapshot.run_state === "running") {
      onPause();
    } else if (snapshot.run_state === "paused") {
      onResume();
    } else {
      onStart();
    }
  };

  // Session pips
  const pips = Array.from({ length: settings.sessions }).map((_, i) => {
    const active = i < snapshot.current_session;
    const col = active ? accentBg : "bg-[#242836]";
    return (
      <div key={i} className={`flex-1 h-[4px] rounded-[2px] ${col}`} />
    );
  });

  return (
    <div
      className="flex h-full w-full flex-col items-center overflow-hidden select-none"
      style={{ backgroundColor: settings.theme_color }}
    >
      {/* Header – drag region */}
      <div
        className="flex items-center justify-between w-full h-[48px] px-5 flex-shrink-0 cursor-default"
        onMouseDown={() => invoke("window_drag").catch(() => {})}
      >
        <span className={`text-[12px] font-semibold tracking-[1.5px] ${accent} pointer-events-none`}>
          {modeLabel}
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onOpenSettings}
          className="p-1 rounded-[6px] hover:bg-[#242836] transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} className="text-[#555B6E]" />
        </button>
      </div>

      {/* Timer ring */}
      <div className="relative w-[210px] h-[210px] flex-shrink-0">
        <TimerRing progress={progress} kind={kind} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6px]">
          <span className="text-[56px] font-semibold tracking-[2px] text-[#F0F2F5] leading-none">
            {formatTime(snapshot.seconds_left)}
          </span>
          <span className="text-[11px] text-[#555B6E]">{subLabel}</span>
        </div>
      </div>

      {/* Task row */}
      <div className="flex items-center justify-center gap-[6px] w-full pt-[8px] pb-[6px] px-5 flex-shrink-0">
        {isBreak ? (
          <Coffee size={12} className="text-[#444857] flex-shrink-0" />
        ) : (
          <PencilLine size={12} className="text-[#444857] flex-shrink-0" />
        )}
        {!isBreak && editingTask ? (
          <input
            ref={taskInputRef}
            value={taskDraft}
            onChange={(e) => setTaskDraft(e.target.value)}
            onBlur={commitTask}
            onKeyDown={(e) => e.key === "Enter" && commitTask()}
            placeholder={t.task_placeholder}
            className="flex-1 max-w-[200px] bg-transparent text-[12px] text-[#8B91A0] outline-none placeholder-[#444857]"
          />
        ) : (
          <button
            onClick={() => !isBreak && setEditingTask(true)}
            className="text-[12px] text-[#8B91A0] truncate max-w-[200px] text-left"
          >
            {isBreak
              ? "少し休んでリフレッシュ"
              : snapshot.task_name || t.task_placeholder}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-[20px] w-full px-10 py-[14px] flex-shrink-0">
        <button
          onClick={onReset}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#242836] hover:bg-[#2A2E3D] transition-colors"
        >
          <RotateCcw size={16} className="text-[#8B91A0]" />
        </button>

        <button
          onClick={handlePlayPause}
          className={`flex items-center justify-center w-[64px] h-[64px] rounded-full ${accentBg} ${accentShadow} hover:brightness-110 active:scale-95 transition-all`}
        >
          {snapshot.run_state === "running" ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white ml-0.5" />
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#242836] hover:bg-[#2A2E3D] transition-colors"
        >
          <SkipForward size={16} className="text-[#8B91A0]" />
        </button>
      </div>

      {/* Session pips */}
      <div className="flex items-center gap-[6px] w-full py-[10px] px-[52px] flex-shrink-0">
        {pips}
      </div>

      {/* Today stats */}
      <div className="flex items-center justify-center gap-[4px] w-full px-5 pt-[6px] pb-5 flex-shrink-0">
        <Flame size={12} className="text-[#444857]" />
        <span className="text-[10px] text-[#444857]">
          {t.today(snapshot.today_sessions, todayMinutes)}
        </span>
      </div>
    </div>
  );
}

// ─── Settings Screen ─────────────────────────────────────────
function SettingsScreen({
  settings,
  onSave,
}: {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}) {
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const t = LANG[draft.language];
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [hexInput, setHexInput] = useState(draft.theme_color);

  // Sync hexInput when theme changes via preset click
  useEffect(() => {
    setHexInput(draft.theme_color);
  }, [draft.theme_color]);

  const inputClass =
    "w-full h-[40px] px-3 rounded-[8px] text-[14px] font-medium outline-none bg-[#2A2E3D] text-[#F0F2F5] placeholder-[#555B6E]";
  const sectionTitle =
    "text-[10px] font-semibold tracking-[2px] text-[#555B6E]";
  const labelClass = "text-[11px] font-medium text-[#8B91A0]";

  const numRow = (label: string, key: keyof AppSettings, min: number, max: number, small?: boolean) => (
    <SettingsRow label={label} small={small}>
      <input
        type="number"
        min={min}
        max={max}
        value={draft[key] as number}
        onChange={(e) =>
          setDraft({ ...draft, [key]: Math.max(min, Math.min(max, +e.target.value || min)) })
        }
        className="w-[48px] text-right bg-transparent text-[13px] font-medium text-[#F0F2F5] outline-none"
      />
    </SettingsRow>
  );

  const toggleRow = (label: string, key: keyof AppSettings, small?: boolean) => (
    <SettingsRow label={label} small={small}>
      <Toggle
        checked={draft[key] as boolean}
        onChange={(v) => setDraft({ ...draft, [key]: v })}
      />
    </SettingsRow>
  );

  const isPreset = THEME_PRESETS.some(
    (p) => p.color.toLowerCase() === draft.theme_color.toLowerCase()
  );

  return (
    <div
      className="flex h-full w-full flex-col select-none"
      style={{ backgroundColor: draft.theme_color }}
    >
      {/* Header – drag region */}
      <div
        className="flex items-center gap-3 w-full h-[48px] px-5 flex-shrink-0 cursor-default"
        onMouseDown={() => invoke("window_drag").catch(() => {})}
      >
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onSave(draft)}
          className="p-1 rounded-[6px] hover:bg-[#242836] transition-colors"
        >
          <ArrowLeft size={18} className="text-[#8B91A0]" />
        </button>
        <span className="text-[15px] font-semibold text-[#F0F2F5] pointer-events-none">{t.settings}</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-4 px-5 pb-6 flex flex-col gap-7"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#2E3345 transparent",
        }}
      >
        {/* Timer */}
        <div className="flex flex-col gap-2">
          <span className={sectionTitle}>{t.timer}</span>
          {/* Focus / Break minutes */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-[6px] flex-1">
              <label className={labelClass}>{t.focusMin}</label>
              <input
                type="number"
                min={1}
                max={120}
                value={draft.focus_minutes}
                onChange={(e) =>
                  setDraft({ ...draft, focus_minutes: +e.target.value || 1 })
                }
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-[6px] flex-1">
              <label className={labelClass}>{t.breakMin}</label>
              <input
                type="number"
                min={1}
                max={60}
                value={draft.break_minutes}
                onChange={(e) =>
                  setDraft({ ...draft, break_minutes: +e.target.value || 1 })
                }
                className={inputClass}
              />
            </div>
          </div>
          {numRow(t.sessions, "sessions", 1, 12)}
          <SettingsRow label={t.longBreak}>
            <Toggle
              checked={draft.long_break_interval > 0}
              onChange={(v) =>
                setDraft({ ...draft, long_break_interval: v ? 4 : 0 })
              }
            />
          </SettingsRow>
          {draft.long_break_interval > 0 && (
            <div className="flex flex-col gap-[6px] pt-1 pl-3">
              <SettingsRow label={t.longBreakLen}>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={draft.long_break_minutes}
                  onChange={(e) =>
                    setDraft({ ...draft, long_break_minutes: Math.max(5, Math.min(60, +e.target.value || 5)) })
                  }
                  className="w-[48px] text-right bg-transparent text-[13px] font-medium text-[#F0F2F5] outline-none rounded-[6px]"
                />
              </SettingsRow>
              <SettingsRow label={t.longBreakInterval}>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={draft.long_break_interval}
                  onChange={(e) =>
                    setDraft({ ...draft, long_break_interval: Math.max(1, Math.min(12, +e.target.value || 1)) })
                  }
                  className="w-[48px] text-right bg-transparent text-[13px] font-medium text-[#F0F2F5] outline-none rounded-[6px]"
                />
              </SettingsRow>
            </div>
          )}
        </div>

        {/* Auto start */}
        <div className="flex flex-col gap-2">
          <span className={sectionTitle}>{t.autoStart}</span>
          {toggleRow(t.autoBreak, "auto_start_break", true)}
          {toggleRow(t.autoFocus, "auto_start_focus", true)}
        </div>

        {/* Notifications */}
        <div className="flex flex-col gap-2">
          <span className={sectionTitle}>{t.notifications}</span>
          {toggleRow(t.notifEnabled, "notifications_enabled")}
          {toggleRow(t.notifSound, "sound_enabled")}
          {toggleRow(t.customMessages, "custom_messages", true)}

          {!draft.custom_messages ? (
            <>
              <div className="flex flex-col gap-[6px]">
                <label className={labelClass}>{t.focusEndMsg}</label>
                <input
                  type="text"
                  value={draft.focus_message}
                  onChange={(e) =>
                    setDraft({ ...draft, focus_message: e.target.value })
                  }
                  className="w-full h-[40px] px-3 rounded-[8px] text-[13px] outline-none bg-[#2A2E3D] text-[#F0F2F5] placeholder-[#555B6E]"
                />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className={labelClass}>{t.breakEndMsg}</label>
                <input
                  type="text"
                  value={draft.break_message}
                  onChange={(e) =>
                    setDraft({ ...draft, break_message: e.target.value })
                  }
                  className="w-full h-[40px] px-3 rounded-[8px] text-[13px] outline-none bg-[#2A2E3D] text-[#F0F2F5] placeholder-[#555B6E]"
                />
              </div>
            </>
          ) : (
            <>
              <span className={sectionTitle}>{t.notifMsg}</span>
              <div className="flex flex-col gap-[12px]">
                {Array.from({ length: draft.sessions }).map((_, i) => {
                  const msgs = [...draft.session_messages];
                  while (msgs.length <= i) {
                    msgs.push({
                      focus: draft.focus_message,
                      break_msg: draft.break_message,
                    });
                  }
                  const update = (type: "focus" | "break_msg", val: string) => {
                    const updated = [...msgs];
                    updated[i] = { ...updated[i], [type]: val };
                    setDraft({ ...draft, session_messages: updated });
                  };
                  return (
                    <div key={i} className="flex flex-col gap-[4px]">
                      <span className="text-[11px] font-semibold text-[#3B82F6]">
                        セッション {i + 1}
                      </span>
                      <div className="flex items-center gap-2 h-[36px] px-2.5 rounded-[6px] bg-[#2A2E3D]">
                        <span className="text-[11px] font-medium text-[#3B82F6] shrink-0 w-[30px]">
                          集中
                        </span>
                        <input
                          type="text"
                          value={msgs[i]?.focus ?? ""}
                          onChange={(e) => update("focus", e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[11px] text-[#F0F2F5] placeholder-[#555B6E] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 h-[36px] px-2.5 rounded-[6px] bg-[#2A2E3D]">
                        <span className="text-[11px] font-medium text-[#34D399] shrink-0 w-[30px]">
                          休憩
                        </span>
                        <input
                          type="text"
                          value={msgs[i]?.break_msg ?? ""}
                          onChange={(e) => update("break_msg", e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[11px] text-[#F0F2F5] placeholder-[#555B6E] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* General */}
        <div className="flex flex-col gap-2">
          <span className={sectionTitle}>{t.general}</span>
          {toggleRow(t.alwaysOnTop, "always_on_top")}
          {toggleRow(t.minimizeToTray, "minimize_to_tray", true)}

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setThemeOpen(false); }}
              className="flex items-center justify-between w-full h-[40px] px-3 rounded-[8px] bg-[#2A2E3D]"
            >
              <span className="text-[13px] text-[#8B91A0]">{t.language}</span>
              <span className="flex items-center gap-[6px]">
                <span className="text-[13px] font-medium text-[#F0F2F5]">
                  {LANG_LABELS[draft.language]}
                </span>
                <ChevronDown size={14} className="text-[#555B6E]" />
              </span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-[44px] rounded-[8px] overflow-hidden z-10 shadow-lg bg-[#242836]">
                {(Object.keys(LANG_LABELS) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setDraft({ ...draft, language: lang });
                      setLangOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-[13px] text-[#F0F2F5] hover:bg-[#2A2E3D] ${
                      draft.language === lang ? "font-semibold" : ""
                    }`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <div>
            <button
              onClick={() => { setThemeOpen(!themeOpen); setLangOpen(false); }}
              className="flex items-center justify-between w-full h-[40px] px-3 rounded-[8px] bg-[#2A2E3D]"
            >
              <span className="text-[13px] text-[#8B91A0]">{t.theme}</span>
              <span className="flex items-center gap-[6px]">
                <span
                  className="w-[14px] h-[14px] rounded-full"
                  style={{ backgroundColor: draft.theme_color }}
                />
                <ChevronDown size={14} className="text-[#555B6E]" />
              </span>
            </button>

            {themeOpen && (
              <div className="mt-[6px] rounded-[8px] bg-[#242836] p-3 flex flex-col gap-3">
                {/* Presets */}
                <div className="flex gap-2">
                  {THEME_PRESETS.map((p) => {
                    const active = draft.theme_color.toLowerCase() === p.color.toLowerCase();
                    return (
                      <div key={p.color} className="flex-1 flex flex-col items-center gap-[5px]">
                        <button
                          onClick={() => setDraft({ ...draft, theme_color: p.color })}
                          className="w-9 h-9 rounded-[10px] transition-all"
                          style={{
                            backgroundColor: p.color,
                            outline: active ? "2px solid #3B82F6" : "none",
                            outlineOffset: "2px",
                          }}
                        />
                        <span className={`text-[10px] font-medium ${active ? "text-[#F0F2F5]" : "text-[#8B91A0]"}`}>
                          {p.name}
                        </span>
                      </div>
                    );
                  })}
                  {/* Custom */}
                  <div className="flex-1 flex flex-col items-center gap-[5px]">
                    <button
                      onClick={() => {}}
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: "#242836",
                        border: "1px solid #2E3345",
                        outline: !isPreset ? "2px solid #3B82F6" : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      <Plus size={16} className="text-[#555B6E]" />
                    </button>
                    <span className={`text-[10px] font-medium ${!isPreset ? "text-[#F0F2F5]" : "text-[#8B91A0]"}`}>
                      {t.themeCustom}
                    </span>
                  </div>
                </div>

                {/* Hex input */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#555B6E] shrink-0">HEX</span>
                  <div className="flex-1 flex items-center h-8 px-[10px] rounded-[6px] bg-[#2A2E3D]">
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      onBlur={() => {
                        const v = hexInput.startsWith("#") ? hexInput : "#" + hexInput;
                        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                          setDraft({ ...draft, theme_color: v });
                        } else {
                          setHexInput(draft.theme_color);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = hexInput.startsWith("#") ? hexInput : "#" + hexInput;
                          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                            setDraft({ ...draft, theme_color: v });
                          } else {
                            setHexInput(draft.theme_color);
                          }
                        }
                      }}
                      className="bg-transparent text-[12px] text-[#F0F2F5] outline-none w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<AppScreen>("timer");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<TimerSnapshot>({
    kind: "focus",
    run_state: "idle",
    seconds_left: DEFAULT_SETTINGS.focus_minutes * 60,
    total_seconds: DEFAULT_SETTINGS.focus_minutes * 60,
    current_session: 1,
    focus_count: 0,
    today_sessions: 0,
    today_focus_seconds: 0,
    task_name: "",
    notify: null,
  });
  const [tauriReady, setTauriReady] = useState(false);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const snapshotRef = useRef<TimerSnapshot>(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const screenRef = useRef<AppScreen>("timer");
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Sound beep using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      void ctx.close();
    } catch {
      // AudioContext not available
    }
  }, []);

  // Initialize from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const init = async () => {
      try {
        const s = await invoke<AppSettings>("get_settings");
        setSettings(s);

        const snap = await invoke<TimerSnapshot>("get_snapshot");
        setSnapshot(snap);

        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }

        unlisten = await listen<TimerSnapshot>("timer-tick", (event) => {
          setSnapshot(event.payload);

          if (event.payload.notify) {
            const cur = settingsRef.current;
            if (cur.sound_enabled) playBeep();
            if (cur.notifications_enabled && Notification.permission === "granted") {
              void new Notification("FocusTimer", {
                body: event.payload.notify,
                silent: true,
              });
            }
          }
        });

        setTauriReady(true);
      } catch {
        setTauriReady(false);
      }
    };

    void init();

    return () => {
      unlisten?.();
    };
  }, [playBeep]);

  const invoke_cmd = useCallback(
    async (cmd: string, args?: Record<string, unknown>) => {
      if (!tauriReady) return;
      await invoke(cmd, args).catch(() => {});
    },
    [tauriReady]
  );

  // Keyboard shortcuts: Space=play/pause, R=reset, S=skip
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (screenRef.current !== "timer") return;

      const snap = snapshotRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        if (snap.run_state === "running") void invoke_cmd("timer_pause");
        else if (snap.run_state === "paused") void invoke_cmd("timer_resume");
        else void invoke_cmd("timer_start");
      } else if (e.code === "KeyR") {
        e.preventDefault();
        void invoke_cmd("timer_reset");
      } else if (e.code === "KeyS") {
        e.preventDefault();
        void invoke_cmd("timer_skip");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [invoke_cmd]);

  const handleSaveSettings = async (s: AppSettings) => {
    setSettings(s);
    setScreen("timer");
    await invoke_cmd("save_settings", { newSettings: s });
  };

  const handleTaskNameChange = async (name: string) => {
    setSnapshot((prev) => ({ ...prev, task_name: name }));
    await invoke_cmd("set_task_name", { name });
  };

  const rootClass =
    "flex h-full w-full items-center justify-center";

  if (screen === "settings") {
    return (
      <div className={rootClass} style={{ backgroundColor: settings.theme_color }}>
        <SettingsScreen
          settings={settings}
          onSave={handleSaveSettings}
        />
      </div>
    );
  }

  return (
    <div className={rootClass} style={{ backgroundColor: settings.theme_color }}>
      <TimerScreen
        snapshot={snapshot}
        settings={settings}
        onStart={() => invoke_cmd("timer_start")}
        onPause={() => invoke_cmd("timer_pause")}
        onResume={() => invoke_cmd("timer_resume")}
        onReset={() => invoke_cmd("timer_reset")}
        onSkip={() => invoke_cmd("timer_skip")}
        onTaskNameChange={handleTaskNameChange}
        onOpenSettings={() => setScreen("settings")}
      />
    </div>
  );
}
