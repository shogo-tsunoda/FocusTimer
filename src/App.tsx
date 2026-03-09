import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type AppScreen = "timer" | "settings";
type TimerMode = "focus" | "break";
type TimerState = "idle" | "running" | "paused";
type Language = "ja" | "en";

interface SessionMessage {
  focus: string;
  break: string;
}

interface AppSettings {
  focusMinutes: number;
  breakMinutes: number;
  sessions: number;
  focusMessage: string;
  breakMessage: string;
  customPerSession: boolean;
  sessionMessages: SessionMessage[];
  language: Language;
  darkMode: boolean;
}

const LANG: Record<Language, Record<string, string>> = {
  ja: {
    focus: "FOCUS",
    break: "BREAK",
    settings: "設定",
    timer: "タイマー",
    focusMin: "集中 (分)",
    breakMin: "休憩 (分)",
    sessions: "セッション数",
    notifications: "通知",
    focusMsg: "集中終了メッセージ",
    breakMsg: "休憩終了メッセージ",
    customPerSession: "セッション別カスタム",
    general: "一般",
    language: "言語",
    darkMode: "ダークモード",
    save: "保存",
    sessionOf: (c: number, t: number) => `セッション ${c} / ${t}`,
    shortBreak: "休憩タイム",
  },
  en: {
    focus: "FOCUS",
    break: "BREAK",
    settings: "Settings",
    timer: "TIMER",
    focusMin: "Focus (min)",
    breakMin: "Break (min)",
    sessions: "Sessions",
    notifications: "NOTIFICATIONS",
    focusMsg: "Focus complete message",
    breakMsg: "Break complete message",
    customPerSession: "Custom per session",
    general: "GENERAL",
    language: "Language",
    darkMode: "Dark mode",
    save: "Save",
    sessionOf: (c: number, t: number) => `Session ${c} of ${t}`,
    shortBreak: "Short break",
  },
};

const LANG_LABELS: Record<Language, string> = { ja: "日本語", en: "English" };

// ─── Circular Progress ───────────────────────────────────────
function CircularProgress({
  progress,
  mode,
  darkMode,
}: {
  progress: number;
  mode: TimerMode;
  darkMode: boolean;
}) {
  const r = 96;
  const stroke = 4;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  const accentColor = mode === "focus" ? "#3B82F6" : "#34D399";
  const trackColor = darkMode ? "#242836" : "#D1D5DB";

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0">
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={trackColor} strokeWidth={stroke}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={accentColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-1000 ease-linear"
      />
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="85" fill="url(#glow)" />
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
      className={`relative w-[40px] h-[22px] rounded-full transition-colors ${
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

// ─── Timer Screen ────────────────────────────────────────────
function TimerScreen({
  settings,
  onOpenSettings,
}: {
  settings: AppSettings;
  onOpenSettings: () => void;
}) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [state, setState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(settings.focusMinutes * 60);
  const [currentSession, setCurrentSession] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = LANG[settings.language];
  const dark = settings.darkMode;

  const totalSeconds =
    mode === "focus" ? settings.focusMinutes * 60 : settings.breakMinutes * 60;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setState("idle");
            if (mode === "focus") {
              const msg =
                settings.customPerSession && settings.sessionMessages[currentSession - 1]
                  ? settings.sessionMessages[currentSession - 1].focus
                  : settings.focusMessage;
              new Notification(msg);
              setMode("break");
              return settings.breakMinutes * 60;
            } else {
              const msg =
                settings.customPerSession && settings.sessionMessages[currentSession - 1]
                  ? settings.sessionMessages[currentSession - 1].break
                  : settings.breakMessage;
              new Notification(msg);
              const next = currentSession + 1;
              if (next > settings.sessions) {
                setCurrentSession(1);
              } else {
                setCurrentSession(next);
              }
              setMode("focus");
              return settings.focusMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [state, mode, settings, currentSession, clearTimer]);

  useEffect(() => {
    setState("idle");
    clearTimer();
    setSecondsLeft(
      mode === "focus" ? settings.focusMinutes * 60 : settings.breakMinutes * 60
    );
  }, [settings.focusMinutes, settings.breakMinutes, mode, clearTimer]);

  const handlePlayPause = () => {
    if (state === "running") setState("paused");
    else setState("running");
  };

  const handleReset = () => {
    clearTimer();
    setState("idle");
    setSecondsLeft(totalSeconds);
  };

  const handleSkip = () => {
    clearTimer();
    setState("idle");
    if (mode === "focus") {
      setMode("break");
      setSecondsLeft(settings.breakMinutes * 60);
    } else {
      setMode("focus");
      setSecondsLeft(settings.focusMinutes * 60);
      if (currentSession < settings.sessions) setCurrentSession((c) => c + 1);
      else setCurrentSession(1);
    }
  };

  const accent = mode === "focus" ? "text-[#3B82F6]" : "text-[#34D399]";
  const accentBg = mode === "focus" ? "bg-[#3B82F6]" : "bg-[#34D399]";
  const accentShadow =
    mode === "focus"
      ? "shadow-[0_4px_24px_rgba(59,130,246,0.25)]"
      : "shadow-[0_4px_24px_rgba(52,211,153,0.25)]";

  return (
    <div
      className={`flex flex-col items-center justify-center w-[300px] h-[400px] rounded-[16px] select-none ${
        dark ? "bg-[#0F1117]" : "bg-[#F5F7FA]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full h-[48px] px-5">
        <span className={`text-[11px] font-semibold tracking-[2px] ${accent}`}>
          {mode === "focus" ? t.focus : t.break}
        </span>
        <button onClick={onOpenSettings} className="p-1">
          <Settings
            size={18}
            className={dark ? "text-[#555B6E]" : "text-[#9CA3AF]"}
          />
        </button>
      </div>

      {/* Timer ring */}
      <div className="relative w-[200px] h-[200px]">
        <CircularProgress progress={progress} mode={mode} darkMode={dark} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className={`text-[48px] font-extralight tracking-[2px] ${
              dark ? "text-[#F0F2F5]" : "text-[#1F2937]"
            }`}
          >
            {formatTime(secondsLeft)}
          </span>
          <span
            className={`text-[11px] ${
              dark ? "text-[#555B6E]" : "text-[#9CA3AF]"
            }`}
          >
            {mode === "focus"
              ? (t.sessionOf as (c: number, t: number) => string)(
                  currentSession,
                  settings.sessions
                )
              : t.shortBreak}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 w-full py-6 px-10">
        <button
          onClick={handleReset}
          className={`flex items-center justify-center w-[44px] h-[44px] rounded-full ${
            dark ? "bg-[#242836]" : "bg-[#E5E7EB]"
          }`}
        >
          <RotateCcw
            size={18}
            className={dark ? "text-[#8B91A0]" : "text-[#6B7280]"}
          />
        </button>
        <button
          onClick={handlePlayPause}
          className={`flex items-center justify-center w-[64px] h-[64px] rounded-full ${accentBg} ${accentShadow}`}
        >
          {state === "running" ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white ml-0.5" />
          )}
        </button>
        <button
          onClick={handleSkip}
          className={`flex items-center justify-center w-[44px] h-[44px] rounded-full ${
            dark ? "bg-[#242836]" : "bg-[#E5E7EB]"
          }`}
        >
          <SkipForward
            size={18}
            className={dark ? "text-[#8B91A0]" : "text-[#6B7280]"}
          />
        </button>
      </div>

      {/* Session dots */}
      <div className="flex items-center justify-center gap-2 pb-6">
        {Array.from({ length: settings.sessions }).map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all ${
              i < currentSession
                ? `w-2 h-2 ${accentBg}`
                : `w-1.5 h-1.5 ${dark ? "bg-[#555B6E]" : "bg-[#D1D5DB]"}`
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Settings Screen ─────────────────────────────────────────
function SettingsScreen({
  settings,
  onSave,
  onBack,
}: {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const t = LANG[draft.language];
  const dark = draft.darkMode;

  const inputClass = `w-full h-[40px] px-3 rounded-[8px] text-[14px] font-medium outline-none ${
    dark
      ? "bg-[#2A2E3D] text-[#F0F2F5] placeholder-[#555B6E]"
      : "bg-[#F0F2F5] text-[#1F2937] placeholder-[#9CA3AF]"
  }`;
  const labelClass = `text-[11px] font-medium ${
    dark ? "text-[#8B91A0]" : "text-[#6B7280]"
  }`;
  const sectionTitle = `text-[10px] font-semibold tracking-[2px] ${
    dark ? "text-[#555B6E]" : "text-[#9CA3AF]"
  }`;
  const rowClass = `flex items-center justify-between w-full h-[40px] px-3 rounded-[8px] ${
    dark ? "bg-[#2A2E3D]" : "bg-[#F0F2F5]"
  }`;
  const rowLabel = `text-[13px] ${dark ? "text-[#8B91A0]" : "text-[#6B7280]"}`;
  const rowValue = `text-[13px] font-medium ${
    dark ? "text-[#F0F2F5]" : "text-[#1F2937]"
  }`;

  const [langOpen, setLangOpen] = useState(false);

  return (
    <div
      className={`flex flex-col w-[300px] h-[530px] rounded-[16px] select-none ${
        dark ? "bg-[#0F1117]" : "bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 w-full h-[48px] px-5">
        <button onClick={onBack}>
          <ArrowLeft
            size={18}
            className={dark ? "text-[#8B91A0]" : "text-[#6B7280]"}
          />
        </button>
        <span
          className={`text-[15px] font-semibold ${
            dark ? "text-[#F0F2F5]" : "text-[#1F2937]"
          }`}
        >
          {t.settings}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-5 px-5 pt-2 pb-1 overflow-y-auto">
        {/* Timer section */}
        <div className="flex flex-col gap-3">
          <span className={sectionTitle}>{t.timer}</span>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass}>{t.focusMin}</label>
              <input
                type="number"
                min={1}
                max={120}
                value={draft.focusMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, focusMinutes: +e.target.value || 1 })
                }
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass}>{t.breakMin}</label>
              <input
                type="number"
                min={1}
                max={60}
                value={draft.breakMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, breakMinutes: +e.target.value || 1 })
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className={rowClass}>
            <span className={rowLabel}>{t.sessions}</span>
            <input
              type="number"
              min={1}
              max={12}
              value={draft.sessions}
              onChange={(e) => {
                const newCount = +e.target.value || 1;
                const msgs = [...draft.sessionMessages];
                while (msgs.length < newCount) {
                  msgs.push({ focus: draft.focusMessage, break: draft.breakMessage });
                }
                setDraft({ ...draft, sessions: newCount, sessionMessages: msgs });
              }}
              className={`w-[48px] text-right bg-transparent outline-none ${rowValue}`}
            />
          </div>
        </div>

        {/* Notifications section */}
        <div className="flex flex-col gap-3">
          <span className={sectionTitle}>{t.notifications}</span>

          {/* Custom per session toggle */}
          <div className={rowClass}>
            <span className={`text-[12px] ${dark ? "text-[#8B91A0]" : "text-[#6B7280]"}`}>
              {t.customPerSession}
            </span>
            <Toggle
              checked={draft.customPerSession}
              onChange={(v) => {
                const msgs = [...draft.sessionMessages];
                while (msgs.length < draft.sessions) {
                  msgs.push({ focus: draft.focusMessage, break: draft.breakMessage });
                }
                setDraft({ ...draft, customPerSession: v, sessionMessages: msgs });
              }}
            />
          </div>

          {!draft.customPerSession ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>{t.focusMsg}</label>
                <input
                  type="text"
                  value={draft.focusMessage}
                  onChange={(e) =>
                    setDraft({ ...draft, focusMessage: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>{t.breakMsg}</label>
                <input
                  type="text"
                  value={draft.breakMessage}
                  onChange={(e) =>
                    setDraft({ ...draft, breakMessage: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <div
              className={`flex flex-col gap-2 max-h-[180px] overflow-y-auto rounded-[8px] pr-1 ${
                dark ? "scrollbar-dark" : ""
              }`}
            >
              {Array.from({ length: draft.sessions }).flatMap((_, i) => {
                const msgs = [...draft.sessionMessages];
                while (msgs.length <= i) {
                  msgs.push({ focus: draft.focusMessage, break: draft.breakMessage });
                }
                const updateMsg = (
                  idx: number,
                  type: "focus" | "break",
                  value: string
                ) => {
                  const updated = [...msgs];
                  updated[idx] = { ...updated[idx], [type]: value };
                  setDraft({ ...draft, sessionMessages: updated });
                };

                return [
                  <div
                    key={`${i}-focus`}
                    className={`flex items-center gap-2 h-[36px] px-2.5 rounded-[6px] ${
                      dark ? "bg-[#2A2E3D]" : "bg-[#F0F2F5]"
                    }`}
                  >
                    <span className="text-[12px] font-bold text-[#3B82F6] w-[14px] text-center shrink-0">
                      {i + 1}
                    </span>
                    <span
                      className={`w-px h-[16px] shrink-0 ${
                        dark ? "bg-[#2E3345]" : "bg-[#D1D5DB]"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-[#3B82F6] shrink-0">
                      Focus
                    </span>
                    <input
                      type="text"
                      value={msgs[i]?.focus ?? ""}
                      onChange={(e) => updateMsg(i, "focus", e.target.value)}
                      className={`flex-1 min-w-0 bg-transparent text-[11px] outline-none ${
                        dark
                          ? "text-[#F0F2F5] placeholder-[#555B6E]"
                          : "text-[#1F2937] placeholder-[#9CA3AF]"
                      } focus:ring-1 focus:ring-[#3B82F6] rounded px-1`}
                    />
                  </div>,
                  <div
                    key={`${i}-break`}
                    className={`flex items-center gap-2 h-[36px] px-2.5 rounded-[6px] ${
                      dark ? "bg-[#2A2E3D]" : "bg-[#F0F2F5]"
                    }`}
                  >
                    <span className="text-[12px] font-bold text-[#34D399] w-[14px] text-center shrink-0">
                      {i + 1}
                    </span>
                    <span
                      className={`w-px h-[16px] shrink-0 ${
                        dark ? "bg-[#2E3345]" : "bg-[#D1D5DB]"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-[#34D399] shrink-0">
                      Break
                    </span>
                    <input
                      type="text"
                      value={msgs[i]?.break ?? ""}
                      onChange={(e) => updateMsg(i, "break", e.target.value)}
                      className={`flex-1 min-w-0 bg-transparent text-[11px] outline-none ${
                        dark
                          ? "text-[#F0F2F5] placeholder-[#555B6E]"
                          : "text-[#1F2937] placeholder-[#9CA3AF]"
                      } focus:ring-1 focus:ring-[#34D399] rounded px-1`}
                    />
                  </div>,
                ];
              })}
            </div>
          )}
        </div>

        {/* General section */}
        <div className="flex flex-col gap-3">
          <span className={sectionTitle}>{t.general}</span>

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`${rowClass} cursor-pointer`}
            >
              <span className={rowLabel}>{t.language}</span>
              <span className="flex items-center gap-1.5">
                <span className={rowValue}>
                  {LANG_LABELS[draft.language]}
                </span>
                <ChevronDown
                  size={14}
                  className={dark ? "text-[#555B6E]" : "text-[#9CA3AF]"}
                />
              </span>
            </button>
            {langOpen && (
              <div
                className={`absolute right-0 top-[44px] rounded-[8px] overflow-hidden z-10 shadow-lg ${
                  dark ? "bg-[#242836]" : "bg-white border border-[#E5E7EB]"
                }`}
              >
                {(Object.keys(LANG_LABELS) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setDraft({ ...draft, language: lang });
                      setLangOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-[13px] ${
                      dark
                        ? "text-[#F0F2F5] hover:bg-[#2A2E3D]"
                        : "text-[#1F2937] hover:bg-[#F5F7FA]"
                    } ${draft.language === lang ? "font-semibold" : ""}`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <div className={rowClass}>
            <span className={rowLabel}>{t.darkMode}</span>
            <Toggle
              checked={draft.darkMode}
              onChange={(v) => setDraft({ ...draft, darkMode: v })}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={() => onSave(draft)}
          className="w-full h-[42px] rounded-[8px] bg-[#3B82F6] text-white text-[14px] font-semibold shadow-[0_2px_16px_rgba(59,130,246,0.19)] hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {t.save}
        </button>
        <div className="h-1" />
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<AppScreen>("timer");
  const [settings, setSettings] = useState<AppSettings>({
    focusMinutes: 25,
    breakMinutes: 5,
    sessions: 4,
    focusMessage: "Time for a break!",
    breakMessage: "Back to work!",
    customPerSession: false,
    sessionMessages: [
      { focus: "Great job! Take a break.", break: "Back to work!" },
      { focus: "Keep going!", break: "Relax a bit." },
      { focus: "Almost there!", break: "Stretch time." },
      { focus: "Final push!", break: "Well done!" },
    ],
    language: "ja",
    darkMode: true,
  });

  if (screen === "settings") {
    return (
      <SettingsScreen
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          setScreen("timer");
        }}
        onBack={() => setScreen("timer")}
      />
    );
  }

  return (
    <TimerScreen
      settings={settings}
      onOpenSettings={() => setScreen("settings")}
    />
  );
}
