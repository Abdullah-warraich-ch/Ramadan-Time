import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, Sun, ChevronLeft, RefreshCw, CalendarDays, Check, Navigation, MapPin, Share2, Plus, BookOpen, RotateCcw, X, Info, Search, Heart, Sparkles } from "lucide-react";
import { parseTime, getTodayString, formatTo12Hour } from "./utils/time";
import { allahNames } from "./data/names";

const CACHE_KEY = "ramadan_schedule_cache_v1";
const DEFAULT_COORDS = { lat: 24.8607, lon: 67.0011 };
const API_URL = "https://islamicapi.com/api/v1/ramadan/";
const API_KEY = "xZaaeSeRVvFTVjojf6KQOBYT7aihHJAAnu3zdHQVTNTvjQR3";

function readScheduleCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeScheduleCache({ data, coords, city, timestamp }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data, coords, city, timestamp }));
  } catch {
    // Ignore cache write failures (private mode/storage limits)
  }
}

function getBrowserCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      (error) => reject(error),
      { timeout: 5000 }
    );
  });
}

async function resolveCityName(lat, lon) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const json = await response.json();
    return json.city || json.locality || json.principalSubdivision || "Your Location";
  } catch {
    return "Your Location";
  }
}

// --- Components ---

const safeClone = (element, props) => {
  if (!React.isValidElement(element)) return null;
  return React.cloneElement(element, props);
};

function ToolkitItem({ icon, label, onClick, color, progress }) {
  const accentColors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  const progressColors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center justify-center text-center overflow-hidden h-32`}
    >
      <div className={`p-3 rounded-2xl mb-2 transition-transform group-hover:scale-110 duration-500 ${accentColors[color]}`}>
        {safeClone(icon, { size: 18 })}
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors uppercase">{label}</p>
      {progress !== undefined && !isNaN(progress) && (
        <div className="w-10 h-1 rounded-full bg-white/5 mt-3 overflow-hidden">
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${progressColors[color]}`}
          />
        </div>
      )}
    </Motion.button>
  );
}

function FloatingActionMenu({ onShare, shareStatus, count, setShowTasbih, setShowChecklist }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerVariants = {
    open: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const itemVariants = {
    open: (deg) => ({
      opacity: 1, scale: 1, rotate: 0,
      x: Math.cos((deg * Math.PI) / 180) * 85,
      y: Math.sin((deg * Math.PI) / 180) * 85,
      transition: { type: "spring", stiffness: 400, damping: 18 }
    }),
    closed: {
      opacity: 0, scale: 0.3, rotate: -45, x: 0, y: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[60]">
      <Motion.div
        animate={isOpen ? { scale: 1.5, opacity: 1 } : { scale: 0, opacity: 0 }}
        className="absolute -inset-10 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <Motion.div variants={containerVariants} initial="closed" animate={isOpen ? "open" : "closed"} className="relative">
        <Motion.button
          custom={-90} variants={itemVariants}
          onClick={() => { setShowTasbih(true); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-sky-500/20 hover:border-sky-500/50 transition-colors"
        >
          <Clock size={16} className="group-hover:text-sky-300 transition-colors" />
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Tasbih</span>
        </Motion.button>

        <Motion.button
          custom={-110} variants={itemVariants}
          onClick={() => { setShowChecklist(true); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
        >
          <Check size={16} className="group-hover:text-emerald-300 transition-colors" />
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Deeds</span>
        </Motion.button>

        <Motion.button
          custom={-130} variants={itemVariants} onClick={() => { onShare(); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-white/10 transition-colors"
        >
          {shareStatus === "idle" ? <Share2 size={16} /> : <Check size={16} className="text-emerald-400" />}
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Share</span>
        </Motion.button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 border-2 shadow-xl ${isOpen ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
        >
          <Plus size={24} className={`transition-transform duration-500 ${isOpen ? "rotate-[135deg]" : ""}`} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black border-2 border-black">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </Motion.div>
    </div>
  );
}

function CountdownBlock({ value, label, highlight }) {
  return (
    <div className="flex flex-col items-center shrink min-w-0">
      <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tabular-nums tracking-tighter leading-[0.9] filter drop-shadow-xl ${highlight ? 'text-sky-300' : 'text-white'} transition-all duration-500`}>
        {value}
      </div>
      <span className="text-[9px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase font-bold text-slate-400 opacity-60 shrink-0">{label}</span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-thin text-white/10 mt-0 select-none shrink-0">:</div>
  );
}

function TimingTile({ icon, label, time, active }) {
  return (
    <div className={`group p-2 sm:p-4 md:p-6 rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-700 relative overflow-hidden flex flex-col items-center justify-center shrink-0 ${active ? 'bg-white/10 border-white/20 scale-[1.02] shadow-xl ring-1 ring-white/10' : 'bg-white/5 border-transparent opacity-40 hover:opacity-70 hover:bg-white/8'}`}>
      {active && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-transparent pointer-none" />
      )}
      <div className={`w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl mb-1 sm:mb-3 md:mb-4 transition-transform group-hover:scale-110 duration-500 ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/30'}`}>
        {safeClone(icon, { size: 14 })}
      </div>
      <p className={`text-[6px] sm:text-[8px] md:text-[9px] lg:text-[11px] font-black tracking-[.1em] sm:tracking-[.2em] uppercase mb-0.5 sm:mb-1 ${active ? 'text-sky-300/80' : 'text-white/20'}`}>{label}</p>
      <p className={`text-sm sm:text-lg md:text-2xl lg:text-3xl font-black tracking-tight ${active ? 'text-white' : 'text-white/30'}`}>{time}</p>
    </div>
  );
}

// --- Page: Home (Main Tracker) ---

function Home({ data, loading, onRetry, errorMessage, cityName, mockData, setData, setUsingMockData }) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const [currentStatus, setCurrentStatus] = useState("");
  const [todayData, setTodayData] = useState(null);
  const [timeProgress, setTimeProgress] = useState(0);
  const [shareStatus, setShareStatus] = useState("idle");

  // Feature Modals State
  const [showDua, setShowDua] = useState(false);
  const [showTasbih, setShowTasbih] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showMoods, setShowMoods] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [showZakat, setShowZakat] = useState(false);
  const [activeMoodDua, setActiveMoodDua] = useState(null);
  const [activeName, setActiveName] = useState(null);

  // New Features State
  const [juzProgress, setJuzProgress] = useState(() => Number(localStorage.getItem('quran_juz')) || 0);
  const [charityProgress, setCharityProgress] = useState(() => Number(localStorage.getItem('charity_goal')) || 0);
  const [showQuran, setShowQuran] = useState(false);
  const [showCharity, setShowCharity] = useState(false);

  const dailyHadiths = [
    { text: "The best among you are those who have the best manners and character.", source: "Sahih Bukhari" },
    { text: "Whoever fasts Ramadan out of faith and in the hope of reward will be forgiven his previous sins.", source: "Sahih Bukhari" },
    { text: "The Prophet (PBUH) was the most generous of people, and he was most generous during Ramadan.", source: "Sahih Bukhari" },
    { text: "When Ramadan begins, the gates of Paradise are opened and the gates of Hell are closed.", source: "Sahih Muslim" },
    { text: "A person's wealth is not diminished by charity.", source: "Sahih Muslim" }
  ];

  const getInspiration = () => {
    if (!todayData) return dailyHadiths[0];
    const idx = Math.abs(Number(todayData.day || 0)) % dailyHadiths.length;
    return dailyHadiths[idx] || dailyHadiths[0];
  };

  const inspiration = getInspiration();

  useEffect(() => { localStorage.setItem('quran_juz', juzProgress.toString()); }, [juzProgress]);
  useEffect(() => { localStorage.setItem('charity_goal', charityProgress.toString()); }, [charityProgress]);

  // Tasbih Persistence
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('tasbih_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  useEffect(() => { localStorage.setItem('tasbih_count', count.toString()); }, [count]);

  // Checklist logic
  const today = getTodayString();
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`checklist_${today}`);
    return saved ? JSON.parse(saved) : { fasting: false, prayers: false, taraweeh: false, quran: false, charity: false };
  });
  useEffect(() => { localStorage.setItem(`checklist_${today}`, JSON.stringify(checklist)); }, [checklist, today]);

  const toggleTask = (task) => setChecklist(prev => ({ ...prev, [task]: !prev[task] }));

  // Zakat Calculator State
  const [zakatInputs, setZakatInputs] = useState({ cash: "", gold: "", silver: "", investments: "", debts: "" });
  const [zakatResult, setZakatResult] = useState(0);
  const calculateZakat = () => {
    const total = (Number(zakatInputs.cash) || 0) + (Number(zakatInputs.gold) || 0) + (Number(zakatInputs.silver) || 0) + (Number(zakatInputs.investments) || 0) - (Number(zakatInputs.debts) || 0);
    setZakatResult(Math.max(0, total * 0.025));
  };

  const moodDuas = [
    { mood: "Anxious", emoji: "😰", arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", english: "O Allah, I seek refuge in You from anxiety and sorrow." },
    { mood: "Sad", emoji: "😔", arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", english: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers." },
    { mood: "Happy", emoji: "😊", arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", english: "All praise is for Allah by whose favor good things are perfected." },
    { mood: "Angry", emoji: "😠", arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", english: "I seek refuge in Allah from the accursed devil." }
  ];

  const duas = [
    { title: "Dua for Fasting", arabic: "وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ", english: "I intend to keep the fast for tomorrow in the month of Ramadan." },
    { title: "Dua for Breaking Fast", arabic: "اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", english: "O Allah! I fasted for You and I believe in You and I put my trust in You and with Your sustenance I break my fast." },
    { title: "Dua for Forgiveness", arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", english: "O Allah, You are Most Forgiving, and You love forgiveness; so forgive me." }
  ];

  useEffect(() => {
    if (!data || !data.fasting) return;
    const updateCountdown = () => {
      const now = new Date();
      const todayStr = getTodayString();
      let currentIndex = data.fasting.findIndex(f => f.date === todayStr);
      if (currentIndex === -1) currentIndex = data.fasting.findIndex(f => new Date(f.date) > now);
      if (currentIndex === -1) return;
      const currentDay = data.fasting[currentIndex];
      const sahurTime = parseTime(currentDay.time.sahur, currentDay.date);
      const iftarTime = parseTime(currentDay.time.iftar, currentDay.date);
      let targetTime, previousTime, status = "";
      if (now < sahurTime) {
        targetTime = sahurTime;
        const previousDate = new Date(currentDay.date); previousDate.setDate(previousDate.getDate() - 1);
        previousTime = parseTime(currentDay.time.iftar, previousDate.toISOString().split("T")[0]);
        status = "sahur";
      } else if (now < iftarTime) {
        targetTime = iftarTime; previousTime = sahurTime; status = "iftar";
      } else {
        const tomorrowIndex = currentIndex + 1;
        if (tomorrowIndex < data.fasting.length) {
          const tomorrowDay = data.fasting[tomorrowIndex];
          targetTime = parseTime(tomorrowDay.time.sahur, tomorrowDay.date);
          previousTime = iftarTime; status = "sahur";
        }
      }
      setTodayData(currentDay);
      setCurrentStatus(status);
      if (targetTime) {
        let diff = targetTime.getTime() - now.getTime();
        if (diff < 0) diff = 0;
        const h = Math.floor(diff / 3600000); const m = Math.floor((diff / 60000) % 60); const s = Math.floor((diff / 1000) % 60);
        setTimeLeft({ h: h.toString().padStart(2, "0"), m: m.toString().padStart(2, "0"), s: s.toString().padStart(2, "0") });
        if (previousTime && targetTime.getTime() > previousTime.getTime()) {
          const elapsed = now.getTime() - previousTime.getTime(); const totalWindow = targetTime.getTime() - previousTime.getTime();
          setTimeProgress(Math.min(100, Math.max(0, (elapsed / totalWindow) * 100)));
        } else setTimeProgress(0);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handleShareTimings = async () => {
    if (!todayData || !todayData.time) return;
    const text = `Ramadan ${data?.ramadan_year || ""} - ${todayData.date}\n${cityName || "Your Location"}\nSahur: ${formatTo12Hour(todayData.time.sahur)}\nIftar: ${formatTo12Hour(todayData.time.iftar)}`;
    try {
      if (navigator.share) { await navigator.share({ title: `Ramadan Timings`, text, url: window.location.href }); setShareStatus("shared"); }
      else { await navigator.clipboard.writeText(text); setShareStatus("copied"); }
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch { setShareStatus("idle"); }
  };

  if (loading || (data && !todayData)) {
    return (
      <div className="relative z-10 w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Synchronizing Schedule...</p>
        </div>
      </div>
    );
  }

  if (!data || !todayData) {
    return (
      <div className="relative z-10 w-full h-screen px-6 py-8 flex items-center justify-center">
        <div className="glass-card w-full max-w-sm rounded-[3rem] border border-white/15 p-10 text-center shadow-2xl backdrop-blur-xl bg-white/5">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-rose-400">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-white italic mb-3">CONNECTION <span className="text-rose-400">ERROR</span></h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            {errorMessage || "We couldn't retrieve the Ramadan schedule. Please check your connection."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
            <button
              onClick={() => {
                setData(mockData);
                setUsingMockData(true);
              }}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10"
            >
              Show Offline Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-5xl px-6 py-4 flex flex-col justify-start items-center">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-2 mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white">
              RAMADAN <span className="opacity-30 font-medium">{data.ramadan_year}</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 underline-offset-4">
              <span className="text-[10px] md:text-xs text-slate-400 font-bold tracking-[.3em] uppercase">{todayData.hijri_readable}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[9px] md:text-xs font-bold text-slate-300">
                <MapPin size={10} className="text-sky-400" /> {cityName || "Your Location"}
              </span>
            </div>
          </div>
          <Link to="/ramadan" className="group relative overflow-hidden bg-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 text-[10px] sm:text-xs font-black tracking-[.2em] text-white hover:bg-white/10 transition-all">
            <CalendarDays size={14} className="inline mr-2 text-sky-300" /> CALENDAR
          </Link>
        </div>

        <div className="w-full flex flex-col items-center gap-4">
          <Motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full glass-card rounded-[3rem] p-6 md:p-10 flex flex-col items-center border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px]" />
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Day Progress</span>
                <span className="text-xs font-black tabular-nums text-white/60">{Math.round(timeProgress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                <Motion.div className="h-full bg-gradient-to-r from-sky-400 to-emerald-300 shadow-[0_0_10px_rgba(125,211,252,0.3)]" animate={{ width: `${timeProgress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-sky-300/60">{currentStatus === "iftar" ? "Until Iftar" : "Until Sahur"}</span>
            </div>
            <div className="flex items-center justify-center gap-3 md:gap-6 mb-8">
              <CountdownBlock value={timeLeft.h} label="Hrs" />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.m} label="Min" />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} />
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              <TimingTile icon={<Clock />} label="SAHUR" time={todayData?.time ? formatTo12Hour(todayData.time.sahur) : "--:--"} active={currentStatus === "sahur"} />
              <TimingTile icon={<Sun />} label="IFTAR" time={todayData?.time ? formatTo12Hour(todayData.time.iftar) : "--:--"} active={currentStatus === "iftar"} />
            </div>
          </Motion.div>

          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full max-w-2xl px-2 mt-4">
            <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={40} className="text-sky-300" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-3 flex items-center gap-2"><Sparkles size={12} /> Daily Inspiration</p>
              <p className="text-sm md:text-base font-medium italic text-slate-200 leading-relaxed mb-4">"{inspiration.text}"</p>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">— {inspiration.source}</span>
                <button onClick={() => { navigator.clipboard.writeText(`"${inspiration.text}" — ${inspiration.source}`); alert("Inspiration copied!"); }} className="text-[9px] font-black uppercase tracking-widest text-sky-400/60 hover:text-sky-400">Copy</button>
              </div>
            </div>
          </Motion.div>

          <div className="w-full max-w-2xl px-2 mt-8 mb-24">
            <div className="flex justify-between items-center mb-6"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Spiritual Hub</h3><span className="h-px flex-1 bg-white/5 mx-6" /></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ToolkitItem color="amber" icon={<Info />} label="99 Names" onClick={() => setShowNames(true)} />
              <ToolkitItem color="emerald" icon={<Plus />} label="Zakat Calc" onClick={() => setShowZakat(true)} />
              <ToolkitItem color="indigo" icon={<BookOpen />} label="Daily Duas" onClick={() => setShowDua(true)} />
              <ToolkitItem color="rose" icon={<AlertCircle />} label="Mood Dua" onClick={() => setShowMoods(true)} />
              <ToolkitItem color="sky" icon={<BookOpen />} label="Quran Journey" progress={(juzProgress / 30) * 100} onClick={() => setShowQuran(true)} />
              <ToolkitItem color="violet" icon={<Heart />} label="Charity Jar" progress={charityProgress} onClick={() => setShowCharity(true)} />
            </div>
          </div>
        </div>
      </div>

      <FloatingActionMenu onShare={handleShareTimings} shareStatus={shareStatus} count={count} setShowTasbih={setShowTasbih} setShowChecklist={setShowChecklist} />

      <AnimatePresence>
        {showTasbih && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 shadow-lg" /><button onClick={() => setShowTasbih(false)} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <div className="text-center mb-10"><p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Digital Tasbih</p><h3 className="text-xl font-black italic">COUNT YOUR <span className="text-sky-300">DHIKR</span></h3></div>
              <div className="relative mb-10 text-[10rem] font-black tabular-nums leading-none text-white drop-shadow-2xl">{count}</div>
              <div className="w-full flex flex-col gap-6">
                <Motion.button whileTap={{ scale: 0.95 }} onClick={() => setCount(p => p + 1)} className="w-full py-10 rounded-[2.5rem] bg-white text-black font-black text-6xl shadow-xl">+</Motion.button>
                <button onClick={() => setCount(0)} className="w-full py-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400">Reset Counter</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChecklist && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-lg" /><button onClick={() => setShowChecklist(false)} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <div className="text-center mb-10"><p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Progress</p><h3 className="text-2xl font-black italic">DAILY <span className="text-emerald-300">DEEDS</span></h3></div>
              <div className="w-full space-y-3">
                {[{ id: 'fasting', label: 'Fasting', icon: <Sun size={14} /> }, { id: 'prayers', label: 'Prayers', icon: <Clock size={14} /> }, { id: 'taraweeh', label: 'Taraweeh', icon: <Check size={14} /> }, { id: 'quran', label: 'Recitation', icon: <BookOpen size={14} /> }, { id: 'charity', label: 'Sadaqah', icon: <Plus size={14} /> }].map(t => (
                  <button key={t.id} onClick={() => toggleTask(t.id)} className={`w-full p-5 rounded-3xl border transition-all flex items-center justify-between ${checklist[t.id] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${checklist[t.id] ? 'bg-emerald-500 text-black' : 'bg-white/5'}`}>{t.icon}</div><span className="text-xs font-black uppercase">{t.label}</span></div>
                    {checklist[t.id] && <Check size={18} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNames && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" /><button onClick={() => { setShowNames(false); setActiveName(null); }} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <AnimatePresence mode="wait">
                {!activeName ? (
                  <Motion.div key="g">
                    <h3 className="text-center text-2xl font-black italic mb-8">99 NAMES OF <span className="text-emerald-300">ALLAH</span></h3>
                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar border-white/10">
                      {allahNames.map((n, i) => (<button key={i} onClick={() => setActiveName(n)} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-emerald-500/10"><span className="text-3xl font-arabic mb-2 block">{n.arabic}</span><span className="text-[10px] font-black uppercase text-emerald-300/40">{n.transliteration}</span></button>))}
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div key="d" className="text-center py-10">
                    <button onClick={() => setActiveName(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-300/40"><ChevronLeft size={16} /> Back</button>
                    <div className="text-8xl font-arabic mb-10 text-white">{activeName.arabic}</div>
                    <div className="text-xs font-black uppercase text-emerald-400 tracking-[0.3em] mb-4">{activeName.transliteration}</div>
                    <div className="text-2xl font-black italic text-white mb-10">"{activeName.meaning}"</div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showZakat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" /><button onClick={() => setShowZakat(false)} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <div className="text-center mb-8"><h3 className="text-xl font-black italic">ZAKAT <span className="text-amber-400">CALC</span></h3></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[8px] font-black uppercase opacity-30 ml-2">Cash</label><input type="number" value={zakatInputs.cash} onChange={e => setZakatInputs({ ...zakatInputs, cash: e.target.value })} className="w-full p-4 rounded-2xl bg-white/5 text-white outline-none" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black uppercase opacity-30 ml-2">Assets</label><input type="number" value={zakatInputs.gold} onChange={e => setZakatInputs({ ...zakatInputs, gold: e.target.value })} className="w-full p-4 rounded-2xl bg-white/5 text-white outline-none" /></div>
                </div>
                <button onClick={calculateZakat} className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs">Calculate</button>
                <div className="p-6 rounded-[2rem] bg-white/5 text-center"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Your Zakat Due</p><p className="text-3xl font-black text-amber-400">{zakatResult.toFixed(2)}</p></div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDua && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" /><button onClick={() => setShowDua(false)} className="absolute top-6 right-6 text-white/40"><X size={20} /></button>
              <h3 className="text-xl font-black italic mb-8">DAILY <span className="text-sky-300">DUAS</span></h3>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {duas.map((d, i) => (<div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/5"><p className="text-[10px] font-black text-sky-400/60 uppercase mb-3">{d.title}</p><p className="text-2xl text-right font-arabic leading-relaxed mb-4">{d.arabic}</p><p className="text-xs text-slate-400 italic">"{d.english}"</p></div>))}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoods && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" /><button onClick={() => { setShowMoods(false); setActiveMoodDua(null); }} className="absolute top-6 right-6 text-white/40"><X size={20} /></button>
              <AnimatePresence mode="wait">
                {!activeMoodDua ? (
                  <Motion.div key="s" className="w-full flex flex-col items-center">
                    <h3 className="text-xl font-black italic mb-8">DUA <span className="text-rose-400">FINDER</span></h3>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {moodDuas.map((m, i) => (<button key={i} onClick={() => setActiveMoodDua(m)} className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-rose-500/10"><span className="text-3xl">{m.emoji}</span><span className="text-[10px] font-black uppercase text-white/60">{m.mood}</span></button>))}
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div key="d" className="w-full flex flex-col items-center text-center">
                    <button onClick={() => setActiveMoodDua(null)} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-rose-400/40 self-start"><ChevronLeft size={14} /> Back</button>
                    <div className="text-4xl mb-6">{activeMoodDua.emoji}</div>
                    <p className="text-2xl font-arabic leading-relaxed text-white mb-6 uppercase">{activeMoodDua.arabic}</p>
                    <p className="text-sm text-slate-400 italic font-medium">"{activeMoodDua.english}"</p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuran && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-sky-500" /><button onClick={() => setShowQuran(false)} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <div className="text-center mb-10"><h3 className="text-2xl font-black italic">QURAN <span className="text-sky-400">JOURNEY</span></h3><p className="text-[10px] opacity-40 uppercase font-black uppercase">Track your progress through Juz</p></div>
              <div className="relative h-40 w-40 mx-auto mb-10 flex items-center justify-center border-white/5 border-rounded-full">
                <div className="text-center"><p className="text-5xl font-black text-white">{juzProgress}</p><p className="text-[10px] opacity-30 uppercase font-black">Juz Read</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setJuzProgress(p => Math.max(0, p - 1))} className="py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase text-[10px] hover:text-white">- Decrease</button>
                <button onClick={() => setJuzProgress(p => Math.min(30, p + 1))} className="py-4 rounded-2xl bg-sky-500 text-black font-black uppercase text-[10px]">+ Increase</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCharity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-violet-500" /><button onClick={() => setShowCharity(false)} className="absolute top-8 right-8 text-white/40"><X size={20} /></button>
              <div className="text-center mb-10"><h3 className="text-2xl font-black italic">CHARITY <span className="text-violet-400">JAR</span></h3><p className="text-[10px] opacity-40 uppercase font-black uppercase">Track your Ramadan Sadaqah</p></div>
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 text-center relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full bg-violet-500/20" style={{ height: `${charityProgress}%` }} />
                  <div className="relative z-10"><p className="text-[10px] font-black opacity-30 uppercase mb-2">Completion</p><p className="text-5xl font-black text-violet-400">{charityProgress}%</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setCharityProgress(p => Math.max(0, p - 5))} className="py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase text-[10px]">- 5%</button>
                  <button onClick={() => setCharityProgress(p => Math.min(100, p + 5))} className="py-4 rounded-2xl bg-violet-500 text-black font-black uppercase text-[10px]">+ 5%</button>
                </div>
                <button onClick={() => setCharityProgress(0)} className="w-full py-2 text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">Reset Jar</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Page: RamadanCalendar ---

function RamadanCalendar({ data, loading, onRetry, errorMessage }) {
  if (loading) return null;
  if (!data) return (
    <div className="p-8 text-center"><p className="text-white/60 mb-4">{errorMessage || "Schedule unavailable"}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-wider">Retry</button></div>
  );

  return (
    <div className="p-6 w-full max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-4 mb-8 shrink-0">
        <Link to="/" className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors"><ChevronLeft size={20} /></Link>
        <div><h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">RAMADAN <span className="text-sky-300">SCHEDULE</span></h1><p className="text-[10px] font-black tracking-widest text-white/30 truncate">MONTHLY PRAYER TIMINGS {data.ramadan_year}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.fasting.map((day, i) => (
          <div key={i} className={`p-6 rounded-[2rem] glass-card border-white/5 flex flex-col gap-4 ${getTodayString() === day.date ? 'ring-2 ring-sky-500/50 bg-sky-500/5' : ''}`}>
            <div className="flex justify-between items-start"><div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Day {day.day}</span><span className="text-lg font-black text-white">{day.date_hijri}</span></div><div className="p-2 rounded-xl bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.date}</div></div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5"><p className="text-[8px] font-black uppercase text-slate-500 mb-1">SUHOOR</p><p className="text-xl font-black text-white">{formatTo12Hour(day.time.sahur)}</p></div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5"><p className="text-[8px] font-black uppercase text-slate-500 mb-1">IFTAR</p><p className="text-xl font-black text-emerald-400">{formatTo12Hour(day.time.iftar)}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Component ---

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cityName, setCityName] = useState("");
  const [, setUsingMockData] = useState(false);

  const mockData = useMemo(() => {
    const mockStartDate = new Date("2026-02-18T00:00:00");
    return {
      ramadan_year: "2026 / 1447",
      fasting: Array.from({ length: 30 }, (_, i) => {
        const current = new Date(mockStartDate);
        current.setDate(mockStartDate.getDate() + i);
        return {
          day: i + 1,
          date: current.toISOString().split("T")[0],
          date_hijri: `${i + 1} Ramadan 1447`,
          hijri_readable: `${i + 1} Ramadan 1447`,
          time: { sahur: "05:15 AM", iftar: "06:30 PM" }
        };
      })
    };
  }, []);

  const fetchRamadanData = useCallback(async (forceCoords) => {
    setLoading(true);
    setError("");
    try {
      const cached = readScheduleCache();
      let coords = cached?.coords;
      const cachedData = cached?.data;

      if (forceCoords || !coords) {
        try {
          coords = await getBrowserCoords();
        } catch (e) {
          console.warn("Geolocation failed, using default", e);
          coords = coords || DEFAULT_COORDS;
        }
      }

      const city = await resolveCityName(coords.lat, coords.lon);
      setCityName(city);
      let nextData = null;
      try {
        const res = await fetch(`${API_URL}?lat=${coords.lat}&lon=${coords.lon}&api_key=${API_KEY}`);
        const json = await res.json();

        if (json?.data && Array.isArray(json.data.fasting)) nextData = json.data;
        else if (json?.fasting) nextData = json;
      } catch {
        nextData = null;
      }

      if (nextData) {
        setData(nextData);
        setUsingMockData(false);
        writeScheduleCache({ data: nextData, coords, city, timestamp: Date.now() });
      } else if (cachedData) {
        setData(cachedData);
        setUsingMockData(false);
        setCityName(cached?.city || city);
        setError("Live schedule update failed. Showing last saved schedule.");
      } else {
        setError("API Connection failed. Using offline schedule.");
        setData(mockData);
        setUsingMockData(true);
      }
    } catch {
      setError("Unable to determine location. Using offline schedule.");
      setData(mockData);
      setUsingMockData(true);
    }
    finally { setLoading(false); }
  }, [mockData]);

  useEffect(() => { fetchRamadanData(); }, [fetchRamadanData]);

  return (
    <Router>
      <div className="h-screen w-full relative overflow-hidden bg-black text-white selection:bg-sky-500/30">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: "url(/bg.avif)", opacity: "0.45" }} />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-transparent to-[#020617]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_100%)] opacity-30" />
        </div>
        <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Home data={data} loading={loading} onRetry={() => fetchRamadanData(true)} errorMessage={error} cityName={cityName} mockData={mockData} setData={setData} setUsingMockData={setUsingMockData} />} />
            <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} onRetry={() => fetchRamadanData(true)} errorMessage={error} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
