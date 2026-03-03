import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, Sun, ChevronLeft, RefreshCw, CalendarDays, Check, Navigation, MapPin, Share2, Plus, BookOpen, RotateCcw, X, Info, Search, Heart, Sparkles, Moon } from "lucide-react";
import { parseTime, getTodayString, formatTo12Hour } from "./utils/time";
import { allahNames } from "./data/names";

const CACHE_KEY = "ramadan_schedule_cache_v1";
const API_URL = "https://islamicapi.com/api/v1/ramadan/";
const API_KEY = import.meta.env.VITE_API_KEY || "";
const BASE_SITE_URL = "https://ramadan-time-two.vercel.app";

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

function getLocationErrorMessage(error) {
  if (!error) return "Location is off. Please turn on location and allow permission.";
  if (error.code === 1) return "Location permission denied. Please allow location access in your browser.";
  if (error.code === 2) return "Location is unavailable. Please turn on location services and try again.";
  if (error.code === 3) return "Location request timed out. Please check GPS/location services and try again.";
  return "Location is off. Please turn on location and allow permission.";
}

function isLocationPermissionDenied(error) {
  return error?.code === 1;
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

function setMetaContent(attr, key, content) {
  if (typeof document === "undefined" || !content) return;
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonicalLink(url) {
  if (typeof document === "undefined" || !url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function SeoMeta() {
  const location = useLocation();
  const meta = useMemo(() => {
    if (location.pathname === "/ramadan") {
      return {
        title: "Ramadan 2026 Monthly Calendar | All Sehri & Iftar Timings",
        description:
          "View the complete Ramadan 2026 fasting calendar with daily Sehri and Iftar timings for all 30 days. Accurate prayer times based on your location.",
        keywords: "Ramadan 2026 calendar, Ramadan schedule, 30 days fasting, Sehri Iftar all days, full Ramadan timetable",
        canonical: `${BASE_SITE_URL}/ramadan`,
      };
    }

    return {
      title: "Ramadan Sehri & Iftar Timings 2026 | Live Countdown & Calendar",
      description:
        "Get accurate Sehri and Iftar timings for Ramadan 2026 based on your GPS location. Live countdown, Digital Tasbih, daily duas, Zakat calculator and more.",
      keywords: "Ramadan 2026, Sehri time today, Iftar time today, Ramadan countdown, prayer times, fasting app, Tasbih, duas",
      canonical: `${BASE_SITE_URL}/`,
    };
  }, [location.pathname]);

  useEffect(() => {
    document.title = meta.title;
    setCanonicalLink(meta.canonical);
    setMetaContent("name", "description", meta.description);
    setMetaContent("name", "keywords", meta.keywords);
    setMetaContent("property", "og:title", meta.title);
    setMetaContent("property", "og:description", meta.description);
    setMetaContent("property", "og:url", meta.canonical);
    setMetaContent("name", "twitter:title", meta.title);
    setMetaContent("name", "twitter:description", meta.description);
    setMetaContent("name", "twitter:url", meta.canonical);
  }, [meta]);

  return null;
}

// --- Components ---

const safeClone = (element, props) => {
  if (!React.isValidElement(element)) return null;
  return React.cloneElement(element, props);
};

function ToolkitItem({ icon, label, onClick, color, progress }) {
  const accentColors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/40",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20 group-hover:border-violet-500/40",
  };
  const glowColors = {
    emerald: "rgba(52,211,153,0.12)", amber: "rgba(245,158,11,0.12)",
    indigo: "rgba(99,102,241,0.12)", rose: "rgba(244,63,94,0.12)",
    sky: "rgba(125,211,252,0.12)", violet: "rgba(167,139,250,0.12)",
  };
  const progressColors = {
    emerald: "bg-emerald-500", amber: "bg-amber-500", indigo: "bg-indigo-500",
    rose: "bg-rose-500", sky: "bg-sky-500", violet: "bg-violet-500",
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.03, y: -5, boxShadow: `0 16px 40px ${glowColors[color]}` }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative p-5 rounded-[2rem] bg-white/[0.04] border border-white/[0.06] transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden h-32"
    >
      {/* subtle radial glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glowColors[color]} 0%, transparent 70%)` }} />
      <div className={`relative p-3 rounded-2xl mb-2.5 border transition-all duration-300 ${accentColors[color]}`}>
        {safeClone(icon, { size: 17 })}
      </div>
      <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-white/40 group-hover:text-white/75 transition-colors duration-300 leading-tight">{label}</p>
      {progress !== undefined && !isNaN(progress) && (
        <div className="w-12 h-[3px] rounded-full bg-white/5 mt-2.5 overflow-hidden">
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${progressColors[color]}`}
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
      x: Math.cos((deg * Math.PI) / 180) * 90,
      y: Math.sin((deg * Math.PI) / 180) * 90,
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
        className="absolute -inset-20 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
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
          custom={-130} variants={itemVariants}
          onClick={() => { setShowChecklist(true); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
        >
          <Check size={16} className="group-hover:text-emerald-300 transition-colors" />
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Deeds</span>
        </Motion.button>

        <Motion.button
          custom={-170} variants={itemVariants} onClick={() => { onShare(); setIsOpen(false); }}
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
            <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full  text-[10px] font-black   border-black ${isOpen ? 'bg-black/60 text-white' : 'bg-white text-black'}`}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </Motion.div>
    </div>
  );
}

function CountdownBlock({ value, label, highlight, isSeconds }) {
  return (
    <div className={`flex flex-col items-center shrink min-w-0 ${isSeconds ? 'animate-blink-sec' : ''}`}>
      <Motion.div
        key={value}
        initial={{ opacity: 0.4, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tabular-nums tracking-tighter leading-[0.9] ${highlight
          ? 'text-sky-300 drop-shadow-[0_0_24px_rgba(125,211,252,0.45)]'
          : 'text-white drop-shadow-xl'
          } transition-colors duration-500`}
      >
        {value}
      </Motion.div>
      <span className="text-[9px] md:text-[11px] tracking-[0.25em] uppercase font-black text-white/25 mt-1 shrink-0">{label}</span>
    </div>
  );
}

function RamadanProgressRing({ currentDay }) {
  const percentage = (currentDay / 30) * 100;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full max-w-2xl px-1 mt-4"
    >
      <div className="glass-card rounded-[2rem] p-6 flex items-center justify-between border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
        <div className="z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400/80 mb-1.5 flex items-center gap-1.5">
            Ramadan Journey
          </p>
          <h4 className="text-xl font-black text-white italic">
            DAY <span className="text-sky-300">{currentDay}</span> <span className="text-white/20 font-light">/ 30</span>
          </h4>
          <p className="text-[10px] text-white/40 font-medium mt-1">
            {currentDay >= 30 ? "Ramadan Complete! Eid Mubarak!" : `${30 - currentDay} days remaining in this blessed month`}
          </p>
        </div>

        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-white/5 stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
            <circle
              className="text-sky-400 stroke-current ring-progress"
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/80">
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
    </Motion.div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-thin text-white/10 select-none shrink-0 pb-4">:</div>
  );
}

function TimingTile({ icon, label, time, active }) {
  return (
    <div className={`group p-3 sm:p-5 md:p-7 rounded-[1.25rem] sm:rounded-[1.75rem] md:rounded-[2.25rem] border transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center ${active
      ? 'bg-white/[0.08] border-white/20 shadow-[0_8px_32px_rgba(125,211,252,0.1)] ring-1 ring-white/10'
      : 'bg-white/[0.03] border-white/5 opacity-45 hover:opacity-65 hover:bg-white/[0.05]'
      }`}>
      {active && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/8 via-transparent to-emerald-400/5 pointer-events-none" />
          {/* pulsing active dot */}
          <span className="absolute top-3 right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
          </span>
        </>
      )}
      <div className={`w-7 h-7 sm:w-11 sm:h-11 md:w-13 md:h-13 flex items-center justify-center rounded-xl md:rounded-2xl mb-2 sm:mb-3 md:mb-4 transition-all duration-300 group-hover:scale-110 ${active ? 'bg-white text-black shadow-lg shadow-white/15' : 'bg-white/5 text-white/25'
        }`}>
        {safeClone(icon, { size: 14 })}
      </div>
      <p className={`text-[7px] sm:text-[9px] md:text-[10px] font-black tracking-[.15em] sm:tracking-[.25em] uppercase mb-1 sm:mb-1.5 ${active ? 'text-sky-300/80' : 'text-white/20'
        }`}>{label}</p>
      <p className={`text-sm sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight ${active ? 'text-white' : 'text-white/25'
        }`}>{time}</p>
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

  const dhikrOptions = [
    { arabic: "سُبْحَانَ اللَّهِ", english: "Subhan Allah" },
    { arabic: "الْحَمْدُ لِلَّهِ", english: "Alhamdulillah" },
    { arabic: "اللَّهُ أَكْبَرُ", english: "Allahu Akbar" },
    { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ", english: "La ilaha illallah" },
    { arabic: "أَسْتَغْفِرُ اللّٰهَ", english: "Astaghfirullah" },
    { arabic: "يَا حَيُّ يَا قَيُّومُ", english: "Ya Hayyu Ya Qayyum" },
    { arabic: "حَسْبُنَا اللَّهُ", english: "Hasbunallahu" },
    { arabic: "لَا حَوْلَ وَلَا قُوَّةَ", english: "La Hawla..." }
  ];
  const [activeDhikr, setActiveDhikr] = useState(() => {
    const saved = localStorage.getItem('active_dhikr');
    return saved ? JSON.parse(saved) : dhikrOptions[0];
  });
  useEffect(() => { localStorage.setItem('active_dhikr', JSON.stringify(activeDhikr)); }, [activeDhikr]);

  // New Features State
  const [juzProgress, setJuzProgress] = useState(() => Number(localStorage.getItem('quran_juz')) || 0);
  const [charityProgress, setCharityProgress] = useState(() => Number(localStorage.getItem('charity_goal')) || 0);
  const [showQuran, setShowQuran] = useState(false);
  const [showCharity, setShowCharity] = useState(false);
  const [showQadr, setShowQadr] = useState(false);

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

  // Tasbeeh Persistence (Individual counts)
  const [tasbeehRecords, setTasbeehRecords] = useState(() => {
    const saved = localStorage.getItem('tasbeeh_records');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => { localStorage.setItem('tasbeeh_records', JSON.stringify(tasbeehRecords)); }, [tasbeehRecords]);

  const count = tasbeehRecords[activeDhikr.english] || 0;
  const incrementCount = () => setTasbeehRecords(prev => ({ ...prev, [activeDhikr.english]: (prev[activeDhikr.english] || 0) + 1 }));
  const resetCount = () => setTasbeehRecords(prev => ({ ...prev, [activeDhikr.english]: 0 }));

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
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Timing Loading...</p>
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
      <div className="w-full max-w-5xl px-5 pt-5 pb-4 flex flex-col justify-start items-center">

        {/* ── Header ── */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3 mb-7">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-0.5">
              <span className="text-2xl select-none" aria-hidden>🌙</span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none text-white">
                RAMADAN <span className="text-white/25 font-light">{data.ramadan_year}</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5">
              <span className="text-[9px] md:text-[10px] text-white/35 font-bold tracking-[.28em] uppercase">{todayData.hijri_readable}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-2.5 py-0.5 text-[9px] font-bold text-sky-300/80">
                <MapPin size={9} className="text-sky-400" /> {cityName || "Your Location"}
              </span>
            </div>
          </div>
          <Link
            to="/ramadan"
            className="group flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-sky-500/30 px-5 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black tracking-[.18em] uppercase text-white/70 hover:text-white transition-all duration-300"
          >
            <CalendarDays size={14} className="text-sky-400 group-hover:text-sky-300 transition-colors" /> CALENDAR
          </Link>
        </div>

        <div className="w-full flex flex-col items-center gap-4">
          {/* ── Countdown Card ── */}
          <Motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full glass-card rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* ambient glows */}
            <div className="absolute -top-28 -left-28 w-72 h-72 bg-sky-500/10 rounded-full blur-[110px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-emerald-500/7 rounded-full blur-[90px] pointer-events-none" />

            {/* Progress bar */}
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-white/25">Day Progress</span>
                <span className="text-[10px] font-black tabular-nums text-white/40">{Math.round(timeProgress)}%</span>
              </div>
              <div className="h-[5px] rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.04]">
                <Motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 shadow-[0_0_12px_rgba(125,211,252,0.4)]"
                  animate={{ width: `${timeProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Status label */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[9px] font-black tracking-[0.5em] uppercase text-sky-300/50">
                {currentStatus === "iftar" ? "⬇ Until Iftar" : "⬆ Until Sahur"}
              </span>
            </div>

            {/* Digits */}
            <div className="flex items-center justify-center gap-3 md:gap-6 mb-8">
              <CountdownBlock value={timeLeft.h} label="Hrs" />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.m} label="Min" />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} isSeconds={true} />
            </div>

            {/* Timing tiles */}
            <div className="grid grid-cols-2 gap-3 md:gap-5 w-full max-w-2xl">
              <TimingTile icon={<Clock />} label="SAHUR" time={todayData?.time ? formatTo12Hour(todayData.time.sahur) : "--:--"} active={currentStatus === "sahur"} />
              <TimingTile icon={<Sun />} label="IFTAR" time={todayData?.time ? formatTo12Hour(todayData.time.iftar) : "--:--"} active={currentStatus === "iftar"} />
            </div>
          </Motion.div>

          {/* ── Ramadan Progress Ring ── */}
          <RamadanProgressRing currentDay={todayData?.day || 1} />

          {/* ── Daily Inspiration ── */}
          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="w-full max-w-2xl px-1 mt-3">
            <div className="p-5 rounded-[2rem] bg-gradient-to-br from-sky-500/[0.08] to-indigo-500/[0.04] border border-white/[0.08] backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-8 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none">
                <Sparkles size={36} className="text-sky-300" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400/80 mb-2.5 flex items-center gap-1.5">
                <Sparkles size={11} /> Daily Inspiration
              </p>
              <p className="text-sm font-medium italic text-white/75 leading-relaxed mb-3">&ldquo;{inspiration.text}&rdquo;</p>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/25">&mdash; {inspiration.source}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`"${inspiration.text}" — ${inspiration.source}`); }}
                  className="text-[8px] font-black uppercase tracking-widest text-sky-400/50 hover:text-sky-300 transition-colors"
                >Copy</button>
              </div>
            </div>
          </Motion.div>

          {/* ── Spiritual Hub ── */}
          <div className="w-full max-w-2xl px-1 mt-7 mb-4">
            <div className="flex items-center gap-4 mb-5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/8" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.45em] text-white/25">Spiritual Hub</h3>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/8" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ToolkitItem color="amber" icon={<Info />} label="99 Names" onClick={() => setShowNames(true)} />
              <ToolkitItem color="emerald" icon={<Plus />} label="Zakat Calc" onClick={() => setShowZakat(true)} />
              <ToolkitItem color="indigo" icon={<BookOpen />} label="Daily Duas" onClick={() => setShowDua(true)} />
              <ToolkitItem color="rose" icon={<AlertCircle />} label="Mood Dua" onClick={() => setShowMoods(true)} />
              <ToolkitItem color="sky" icon={<BookOpen />} label="Quran Journey" progress={(juzProgress / 30) * 100} onClick={() => setShowQuran(true)} />
              <ToolkitItem color="violet" icon={<Heart />} label="Charity Jar" progress={charityProgress} onClick={() => setShowCharity(true)} />
              <ToolkitItem color="indigo" icon={<Moon />} label="Night of Power" onClick={() => setShowQadr(true)} />
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="w-full max-w-2xl px-2 pt-6 pb-28 border-t border-white/[0.05] text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20 mb-1">
              Made with ❤️ for Muslims everywhere &nbsp;·&nbsp; رمضان مبارك
            </p>
            <p className="text-[7.5px] text-white/12 tracking-widest uppercase">
              MIT License &nbsp;·&nbsp; © 2026 Abdullah Warraich
            </p>
          </footer>

        </div>
      </div>

      <FloatingActionMenu onShare={handleShareTimings} shareStatus={shareStatus} count={count} setShowTasbih={setShowTasbih} setShowChecklist={setShowChecklist} />

      {/* Laylat al-Qadr Modal */}
      <AnimatePresence>
        {showQadr && (() => {
          const ramadanStart = data?.fasting?.[0]?.date ? new Date(data.fasting[0].date) : null;
          const qadrNights = [21, 23, 25, 27, 29];
          const today = new Date();
          let nextQadrNight = null;
          let daysUntil = null;
          let currentRamadanDay = null;

          if (ramadanStart) {
            const diffMs = today - ramadanStart;
            currentRamadanDay = Math.floor(diffMs / 86400000) + 1;
            const upcoming = qadrNights.find(n => n >= currentRamadanDay);
            if (upcoming) {
              nextQadrNight = upcoming;
              daysUntil = upcoming - currentRamadanDay;
            }
          }

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
              <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm glass-card rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-400 shadow-lg" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.08),_transparent_70%)] pointer-events-none" />
                <button onClick={() => setShowQadr(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={20} /></button>

                <div className="text-center mb-8">
                  <p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Ramadan Special</p>
                  <h3 className="text-xl font-black italic">LAYLAT <span className="text-violet-400">AL-QADR</span></h3>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">The Night of Power</p>
                </div>

                {/* Arabic */}
                <div className="text-4xl font-arabic text-violet-300 mb-2 leading-loose text-center">لَيْلَةُ الْقَدْرِ</div>
                <p className="text-[10px] text-center text-slate-400 italic mb-8 leading-relaxed max-w-[240px]">
                  "Better than a thousand months" — Quran 97:3
                </p>

                {/* Status */}
                {nextQadrNight ? (
                  <div className="w-full space-y-4">
                    <div className="p-6 rounded-[2rem] bg-violet-500/10 border border-violet-500/20 text-center">
                      {daysUntil === 0 ? (
                        <>
                          <div className="text-5xl mb-2">🌙</div>
                          <p className="text-lg font-black text-violet-300">Tonight Could Be</p>
                          <p className="text-3xl font-black text-white">Night {nextQadrNight}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 mt-1">Increase your ibadah tonight!</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 mb-2">Next Possible Night</p>
                          <p className="text-6xl font-black text-white">{daysUntil}</p>
                          <p className="text-sm font-black text-violet-300">{daysUntil === 1 ? 'day' : 'days'} until Night <span className="text-white">{nextQadrNight}</span></p>
                        </>
                      )}
                    </div>

                    <div className="w-full">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 text-center">The Odd Nights</p>
                      <div className="grid grid-cols-5 gap-2">
                        {qadrNights.map(night => (
                          <div key={night} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${currentRamadanDay && currentRamadanDay > night
                            ? 'bg-white/3 border-white/5 opacity-30'
                            : night === nextQadrNight && daysUntil === 0
                              ? 'bg-violet-500/20 border-violet-400/50 ring-1 ring-violet-400/30'
                              : 'bg-white/5 border-white/10'
                            }`}>
                            <Moon size={12} className={night === nextQadrNight ? 'text-violet-400' : 'text-white/30'} />
                            <span className={`text-xs font-black mt-1 ${night === nextQadrNight ? 'text-violet-300' : 'text-white/50'}`}>{night}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center">
                    <div className="text-4xl mb-3">🤲</div>
                    <p className="text-sm font-black text-white/60">All 5 blessed nights have passed.</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/50 mt-2">May Allah accept your ibadah!</p>
                  </div>
                )}
              </Motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showTasbih && (
          <div className="modal-backdrop">
            <Motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="w-full max-w-sm glass-card rounded-[2.8rem] p-8 flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(125,211,252,0.5)]" />
              <button onClick={() => setShowTasbih(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all">
                <X size={16} />
              </button>

              <p className="text-[9px] font-black tracking-[.45em] uppercase text-white/30 mb-1 mt-2">Digital Tasbih</p>
              <h3 className="text-lg font-black mb-6">COUNT YOUR <span className="text-sky-300">DHIKR</span></h3>

              {/* Dhikr selector */}
              <div className="w-full flex overflow-x-auto gap-2.5 mb-7 pb-2 custom-scrollbar-horizontal scroll-smooth">
                {dhikrOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveDhikr(option)}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl border transition-all ${activeDhikr.arabic === option.arabic
                      ? 'bg-sky-500 border-sky-400 text-black shadow-[0_4px_20px_rgba(125,211,252,0.3)]'
                      : 'bg-white/[0.04] border-white/8 text-white/50 hover:border-white/20 hover:text-white/80'
                      }`}
                  >
                    <span className="font-arabic text-base block mb-0.5">{option.arabic}</span>
                    <span className="text-[8px] uppercase tracking-widest opacity-60">{option.english}</span>
                  </button>
                ))}
              </div>

              {/* Big counter */}
              <div className="flex flex-col items-center mb-7">
                <p className="text-2xl font-arabic text-sky-200/70 mb-1">{activeDhikr.arabic}</p>
                <div className="text-[7rem] font-black tabular-nums leading-none text-white drop-shadow-[0_0_30px_rgba(125,211,252,0.2)]">
                  {count}
                </div>
                <p className="text-[9px] uppercase tracking-[0.35em] font-black text-white/20 mt-1">× {activeDhikr.english}</p>
              </div>

              {/* Tap button */}
              <Motion.button
                whileTap={{ scale: 0.94, boxShadow: "0 0 0 24px rgba(125,211,252,0)" }}
                onClick={incrementCount}
                className="w-full py-9 rounded-[2rem] bg-white text-black font-black text-5xl shadow-[0_8px_32px_rgba(255,255,255,0.15)] flex items-center justify-center mb-4 active:bg-sky-50 transition-colors"
              >
                <Plus size={44} strokeWidth={3} />
              </Motion.button>

              <button
                onClick={resetCount}
                className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.35em] text-white/25 hover:text-rose-400/80 transition-colors"
              >Reset Counter</button>
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
          <div className="modal-backdrop">
            <Motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="w-full max-w-sm glass-card rounded-[2.8rem] p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
              <button onClick={() => setShowZakat(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all">
                <X size={16} />
              </button>

              <p className="text-[9px] font-black tracking-[.45em] uppercase text-white/30 mb-1 mt-2">Calculator</p>
              <h3 className="text-lg font-black mb-6">ZAKAT <span className="text-amber-400">DUE</span></h3>

              <div className="space-y-3 mb-5">
                {[
                  { key: "cash", label: "Cash & Bank", placeholder: "0" },
                  { key: "gold", label: "Gold & Silver", placeholder: "0" },
                  { key: "investments", label: "Investments", placeholder: "0" },
                  { key: "debts", label: "Debts (deduct)", placeholder: "0" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[8px] font-black uppercase tracking-[0.25em] text-white/30 mb-1.5 ml-1">{label}</label>
                    <input
                      type="number"
                      placeholder={placeholder}
                      value={zakatInputs[key]}
                      onChange={e => setZakatInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={calculateZakat}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.3)] mb-4"
              >Calculate Zakat</button>

              <div className="p-5 rounded-2xl bg-amber-500/8 border border-amber-500/20 text-center">
                <p className="text-[8px] font-black text-amber-400/60 uppercase tracking-widest mb-1">Your Zakat Due (2.5%)</p>
                <p className="text-4xl font-black text-amber-400 tabular-nums">{zakatResult.toFixed(2)}</p>
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
    <div className="p-10 text-center">
      <p className="text-white/50 mb-5 text-sm">{errorMessage || "Schedule unavailable"}</p>
      <button onClick={onRetry} className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-colors">Retry</button>
    </div>
  );
  const today = getTodayString();
  return (
    <div className="px-5 pt-5 w-full max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-3 mb-7">
        <Link to="/" className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/10">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">RAMADAN <span className="text-sky-300">SCHEDULE</span></h1>
          <p className="text-[9px] font-black tracking-widest text-white/25 uppercase">Monthly Timings · {data.ramadan_year}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.fasting.map((day, i) => {
          const isToday = today === day.date;
          return (
            <div
              key={i}
              className={`p-5 rounded-[1.75rem] glass-card flex flex-col gap-3 transition-all duration-300 ${isToday ? 'border-sky-500/40 shadow-[0_0_24px_rgba(125,211,252,0.1)] bg-sky-500/[0.06]' : 'border-white/[0.05]'
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Day {day.day}</span>
                    {isToday && (
                      <span className="text-[7px] font-black uppercase tracking-widest bg-sky-500 text-black px-1.5 py-0.5 rounded-full">Today</span>
                    )}
                  </div>
                  <span className="text-base font-black text-white">{day.date_hijri}</span>
                </div>
                <span className="text-[9px] font-bold text-white/30 bg-white/5 px-2.5 py-1 rounded-xl">{day.date}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                  <p className="text-[7px] font-black uppercase text-white/30 tracking-widest mb-1">SUHOOR</p>
                  <p className="text-lg font-black text-white">{formatTo12Hour(day.time.sahur)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <p className="text-[7px] font-black uppercase text-emerald-400/60 tracking-widest mb-1">IFTAR</p>
                  <p className="text-lg font-black text-emerald-400">{formatTo12Hour(day.time.iftar)}</p>
                </div>
              </div>
            </div>
          );
        })}
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
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
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

  const fetchRamadanData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const cached = readScheduleCache();
      let coords = null;
      const cachedData = cached?.data;

      try {
        coords = await getBrowserCoords();
        setLocationPermissionDenied(false);
      } catch (e) {
        const locationError = getLocationErrorMessage(e);
        if (isLocationPermissionDenied(e)) {
          setLocationPermissionDenied(true);
          setError(locationError);
          setCityName("");
          setData(null);
          setUsingMockData(false);
          setLoading(false);
          return;
        }

        setError(locationError);
        setCityName("Location Permission Required");

        if (cachedData) {
          setData(cachedData);
          setUsingMockData(false);
          setCityName(cached?.city || "Location Permission Required");
        } else {
          setData(mockData);
          setUsingMockData(true);
        }
        setLoading(false);
        return;
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

  // Automatic reload on permission grant
  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) return;

    let permissionStatus;
    const handlePermissionChange = (e) => {
      if (e.target.state === "granted") {
        fetchRamadanData();
      }
    };

    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      permissionStatus = status;
      status.addEventListener("change", handlePermissionChange);
    });

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener("change", handlePermissionChange);
      }
    };
  }, [fetchRamadanData]);

  if (locationPermissionDenied) {
    return (
      <div className="h-screen w-full bg-black text-white flex items-center justify-center px-6">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-card rounded-[2.5rem] p-10 text-center"
        >
          <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <MapPin size={26} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wide mb-3 text-white">Location Required</h1>
          <p className="text-sm text-white/50 leading-relaxed mb-8">
            {error || "Please allow location access so we can load accurate Sehri & Iftar timings for your city."}
          </p>
          <button
            onClick={fetchRamadanData}
            className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-sky-50 transition-colors"
          >
            Allow Location
          </button>
        </Motion.div>
      </div>
    );
  }

  return (
    <Router>
      <SeoMeta />
      <div className="h-screen w-full relative overflow-hidden bg-black text-white selection:bg-sky-500/30">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: "url(/bg.avif)", opacity: "0.45" }} />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-transparent to-[#020617]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_100%)] opacity-30" />
        </div>
        <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Home data={data} loading={loading} onRetry={fetchRamadanData} errorMessage={error} cityName={cityName} mockData={mockData} setData={setData} setUsingMockData={setUsingMockData} />} />
            <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} onRetry={fetchRamadanData} errorMessage={error} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
