import { useEffect, useState, useCallback } from "react";
import { X, Bell, BellOff, CheckCircle2, AlertCircle, Settings2, Info, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scheduleNotification, sendTestNotification, subscribeUser } from "../../utils/pushNotifications";
import { getTodayString, parseTime } from "../../utils/time";

const REMINDER_MINUTES = [60, 30, 15, 5, 0];

function normalizeDay(dayValue) {
  const day = Number.parseInt(dayValue, 10);
  return Number.isFinite(day) && day > 0 ? day : 1;
}

function getUpcomingEvents(apiData, now) {
  const rows = Array.isArray(apiData?.fasting) ? apiData.fasting : [];
  const today = getTodayString();
  let startIndex = rows.findIndex((row) => row.date === today);
  if (startIndex === -1) {
    startIndex = rows.findIndex((row) => new Date(row.date) >= now);
  }
  if (startIndex < 0) return [];

  const events = [];
  for (let i = startIndex; i < rows.length && i <= startIndex + 1; i += 1) {
    const row = rows[i];
    const sehri = parseTime(row?.time?.sahur, row?.date);
    const iftar = parseTime(row?.time?.iftar, row?.date);
    const day = normalizeDay(row?.day);
    if (sehri && sehri > now) events.push({ kind: "Sehri", at: sehri, day });
    if (iftar && iftar > now) events.push({ kind: "Iftar", at: iftar, day });
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return events.slice(0, 2);
}

function buildReminderPayloads(event, cityName) {
  return REMINDER_MINUTES.map((minutes) => {
    const scheduleAt = new Date(event.at.getTime() - minutes * 60000);
    const isEventTime = minutes === 0;
    const prefix = isEventTime ? `${event.kind} time` : `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
    return {
      title: `${prefix} - ${event.kind}`,
      body: `Ramadan Journey Day ${event.day}/30${cityName ? ` • ${cityName}` : ""}`,
      scheduleAt,
      eventType: event.kind.toLowerCase(),
    };
  });
}

export default function PushSchedulerPanel({ data, cityName }) {
  const [stage, setStage] = useState("collapsed"); // collapsed, prompt, settings, success
  const [userId] = useState(() => {
    const saved = localStorage.getItem("push_user_id");
    if (saved) return saved;
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `user-${Date.now()}`;
  });

  const [permission, setPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const [status, setStatus] = useState("idle");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    localStorage.setItem("push_user_id", userId);
  }, [userId]);

  const ensureSubscribed = useCallback(async () => {
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }
    await subscribeUser(userId);
    setIsSubscribed(true);
  }, [permission, userId]);

  // Handle auto-expansion or hiding based on permission
  useEffect(() => {
    if (permission === "default" && localStorage.getItem("push_panel_refused") !== "1") {
      const timer = setTimeout(() => setStage("prompt"), 2000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  const scheduleApiNotifications = useCallback(async (auto = false) => {
    try {
      if (permission !== "granted") return;
      await ensureSubscribed();

      const now = new Date();
      const upcomingEvents = getUpcomingEvents(data, now);
      if (upcomingEvents.length === 0) return;

      const reminders = upcomingEvents
        .flatMap((event) => buildReminderPayloads(event, cityName))
        .filter((item) => item.scheduleAt.getTime() > now.getTime() + 3000);

      if (reminders.length === 0) return;

      setStatus("scheduling");
      await Promise.all(
        reminders.map((item) =>
          scheduleNotification({
            userId,
            title: item.title,
            body: item.body,
            scheduleAt: item.scheduleAt.toISOString(),
            data: { url: "/", kind: item.eventType },
          })
        )
      );
      localStorage.setItem(`push_schedule_${getTodayString()}`, "1");
      setStatus(`${auto ? "auto-scheduled" : "scheduled"}:${reminders.length}`);

      if (!auto) {
        setStage("success");
        setTimeout(() => setStage("collapsed"), 4000);
      }
    } catch (error) {
      console.error("Scheduling failed:", error);
      setStatus(`error:${error.message}`);
    }
  }, [permission, data, cityName, userId, ensureSubscribed]);

  useEffect(() => {
    if (permission !== "granted" || !data?.fasting?.length) return;
    const scheduleKey = `push_schedule_${getTodayString()}`;
    if (localStorage.getItem(scheduleKey) === "1") {
      ensureSubscribed().catch((error) => setStatus(`error:${error.message}`));
      return;
    }
    scheduleApiNotifications(true);
  }, [permission, data, scheduleApiNotifications, ensureSubscribed]);

  const requestPermissionAndSubscribe = async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        throw new Error("Push not supported");
      }
      setStatus("subscribing");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await ensureSubscribed();
        await scheduleApiNotifications(true);
        setStage("success");
        setTimeout(() => setStage("collapsed"), 4000);
      } else {
        localStorage.setItem("push_panel_refused", "1");
        setStage("collapsed");
      }
    } catch (error) {
      setStatus(`error:${error.message}`);
    }
  };

  const handleTestNotification = async () => {
    try {
      setStatus("testing");
      await ensureSubscribed();
      await sendTestNotification({ userId });
      setStatus("test-sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setStatus(`error:${e?.message || "test-failed"}`);
    }
  };

  if (permission === "unsupported") return null;

  return (
    <div className="fixed left-6 bottom-6 z-[70] pointer-events-none">
      <AnimatePresence mode="wait">
        {stage === "collapsed" && (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setStage(permission === "granted" ? "settings" : "prompt")}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] text-[var(--text-main)] shadow-2xl backdrop-blur-xl hover:bg-sky-500/10 hover:border-sky-500/40 transition-colors"
          >
            {permission === "granted" ? (
              <Bell className="text-sky-400" size={20} />
            ) : (
              <BellOff className="text-[var(--text-dim)]" size={20} />
            )}
          </motion.button>
        )}

        {stage === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            className="pointer-events-auto relative w-[320px] glass-card rounded-[2rem] p-6 shadow-2xl border-sky-500/20"
          >
            <button
              onClick={() => setStage("collapsed")}
              className="absolute right-4 top-4 text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400/80">Stay Updated</p>
                <h4 className="text-sm font-black text-[var(--text-main)]">Sehri & Iftar Alerts</h4>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed mb-6">
              Get timely reminders before Sehri ends and when it's time for Iftar. Never miss a blessed moment.
            </p>

            <button
              onClick={requestPermissionAndSubscribe}
              className="group relative w-full overflow-hidden rounded-xl bg-sky-500 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Enable Notifications <Sparkles size={12} />
              </span>
            </button>
          </motion.div>
        )}

        {stage === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20, y: 20 }}
            className="pointer-events-auto relative w-[280px] glass-card rounded-[2rem] p-6 shadow-2xl"
          >
            <button
              onClick={() => setStage("collapsed")}
              className="absolute right-4 top-4 text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-glass)] text-sky-400">
                <Settings2 size={18} />
              </div>
              <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Alert Settings</h4>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-glass)] border border-[var(--border-glass)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-[var(--text-main)]">Status</span>
                </div>
                <span className="text-[9px] font-black uppercase text-emerald-400">{isSubscribed ? "Active" : "Connecting"}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-glass)] border border-[var(--border-glass)]">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-sky-400" />
                  <span className="text-[10px] font-bold text-[var(--text-main)]">Region</span>
                </div>
                <span className="text-[9px] font-black uppercase text-sky-400 truncate max-w-[80px]">{cityName || "Detected"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => scheduleApiNotifications(false)}
                disabled={status.startsWith("scheduling")}
                className="rounded-xl border border-[var(--border-glass)] bg-[var(--surface-glass)] py-2.5 text-[9px] font-black uppercase tracking-wider text-[var(--text-main)] hover:bg-[var(--surface-glass-hover)] transition-colors disabled:opacity-50"
              >
                Sync Now
              </button>
              <button
                onClick={handleTestNotification}
                className="group rounded-xl bg-white/5 py-2.5 text-[9px] font-black uppercase tracking-wider text-sky-400 border border-sky-500/20 hover:bg-sky-500/10 transition-colors"
              >
                {status === "test-sent" ? "Sent!" : "Test Ping"}
              </button>
            </div>

            {status.includes("error") && (
              <p className="mt-3 text-[9px] text-rose-400 flex items-center gap-1">
                <AlertCircle size={10} /> Syncing Failed.
              </p>
            )}
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl shadow-2xl"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">Alerts Synchronized</p>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
