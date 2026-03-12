import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, Sun, ChevronLeft, RefreshCw, CalendarDays, Check, Navigation, MapPin, Share2, Plus, Download, BookOpen, RotateCcw, X, Info, Search, Heart, Sparkles, Moon } from "lucide-react";
import { getTodayString, formatTo12Hour } from "./utils/time";
import { allahNames } from "./data/names";
import { getCountdownSnapshot } from "./utils/countdown";

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

function readJsonStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readNumberStorage(key, fallback = 0) {
  if (typeof window === "undefined") return fallback;
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
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
          "View the complete Ramadan 2026 fasting calendar with daily Sehri/Suhoor and Iftar timings for all 30 days. Accurate prayer times based on your location.",
        keywords: "Ramadan 2026 calendar, Ramadan schedule, 30 days fasting, Sehri Iftar all days, full Ramadan timetable, suhoor time, sehri time today, iftar time today",
        canonical: `${BASE_SITE_URL}/ramadan`,
      };
    }

    return {
      title: "Ramadan 2026 Sehri & Iftar Timings | Sehri Countdown",
      description:
        "Get accurate Sehri/Suhoor and Iftar timings for Ramadan 2026 by location. Live Sehri countdown and Iftar countdown to the second, plus a full calendar and spiritual tools.",
      keywords: "Ramadan 2026, Sehri time today, Iftar time today, sehri countdown, iftar countdown, how many seconds till iftar, suhoor time, Ramadan countdown, prayer times, fasting app, Tasbih, duas",
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

function DecorativeGlows({ theme }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="decorative-glow" 
          style={{ 
            top: '-10%', 
            left: '-10%', 
            background: theme === 'dark' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(125, 211, 252, 0.4)' 
          }} 
        />
        <div 
          className="decorative-glow" 
          style={{ 
            bottom: '-10%', 
            right: '-10%', 
            background: theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(167, 139, 250, 0.3)',
            animationDelay: '-5s'
          }} 
        />
        <div 
          className="decorative-glow" 
          style={{ 
            top: '40%', 
            left: '60%', 
            width: '30vw',
            height: '30vw',
            background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(110, 231, 183, 0.2)',
            animationDelay: '-10s'
          }} 
        />
    </div>
  );
}


// --- Components ---

const safeClone = (element, props) => {
  if (!React.isValidElement(element)) return null;
  return React.cloneElement(element, props);
};

function ToolkitItem({ icon, label, onClick, color, progress, theme }) {
  const accentColors = {
    emerald: theme === 'light' ? "text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
    amber: theme === 'light' ? "text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200" : "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/40",
    indigo: theme === 'light' ? "text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-50 group-hover:border-indigo-200" : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40",
    rose: theme === 'light' ? "text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200" : "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40",
    sky: theme === 'light' ? "text-sky-600 bg-sky-50 border-sky-100 group-hover:bg-sky-100 group-hover:border-sky-200" : "text-sky-400 bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
    violet: theme === 'light' ? "text-violet-600 bg-violet-50 border-violet-100 group-hover:bg-violet-50 group-hover:border-violet-200" : "text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20 group-hover:border-violet-500/40",
  };
  const glowColors = {
    emerald: "rgba(16,185,129,0.15)", amber: "rgba(245,158,11,0.15)",
    indigo: "rgba(99,102,241,0.15)", rose: "rgba(244,63,94,0.15)",
    sky: "rgba(56,189,248,0.15)", violet: "rgba(139,92,246,0.15)",
  };
  const progressColors = {
    emerald: "bg-emerald-500", amber: "bg-amber-500", indigo: "bg-indigo-500",
    rose: "bg-rose-500", sky: "bg-sky-400", violet: "bg-violet-500",
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.05, y: -8, boxShadow: `0 20px 40px ${theme === 'light' ? 'rgba(0,0,0,0.06)' : glowColors[color]}` }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative p-6 rounded-[2.5rem] bg-[var(--surface-glass)] border border-[var(--border-glass)] transition-all duration-500 flex flex-col items-center justify-center text-center overflow-hidden h-36"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 100%, ${glowColors[color]} 0%, transparent 80%)` }} />
      <div className={`relative p-4 rounded-2xl mb-3 border transition-all duration-500 group-hover:scale-110 ${accentColors[color]}`}>
        {safeClone(icon, { size: 18 })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] group-hover:text-[var(--text-main)] transition-colors duration-500 leading-tight">{label}</p>
      {progress !== undefined && !isNaN(progress) && (
        <div className="w-14 h-[4px] rounded-full bg-[var(--surface-glass)] mt-3.5 overflow-hidden border border-[var(--border-glass)]">
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 1, ease: "circOut" }}
            className={`h-full rounded-full ${progressColors[color]} shadow-[0_0_10px_rgba(56,189,248,0.3)]`}
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
          className="absolute h-12 w-12 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] backdrop-blur-xl text-[var(--text-main)] shadow-2xl flex flex-col items-center justify-center group hover:bg-sky-500/20 hover:border-sky-500/40 transition-colors"
        >
          <Clock size={16} className="group-hover:text-sky-500 transition-colors" />
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Tasbih</span>
        </Motion.button>

        <Motion.button
          custom={-130} variants={itemVariants}
          onClick={() => { setShowChecklist(true); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] backdrop-blur-xl text-[var(--text-main)] shadow-2xl flex flex-col items-center justify-center group hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-colors"
        >
          <Check size={16} className="group-hover:text-emerald-500 transition-colors" />
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Deeds</span>
        </Motion.button>

        <Motion.button
          custom={-170} variants={itemVariants} onClick={() => { onShare(); setIsOpen(false); }}
          className="absolute h-12 w-12 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] backdrop-blur-xl text-[var(--text-main)] shadow-2xl flex flex-col items-center justify-center group hover:bg-sky-500/20 transition-colors"
        >
          {shareStatus === "idle" ? <Share2 size={16} /> : <Check size={16} className="text-emerald-400" />}
          <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Share</span>
        </Motion.button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 border-2 shadow-xl ${isOpen ? 'bg-[var(--text-main)] text-[var(--bg-app)] border-[var(--text-main)]' : 'bg-slate-950/98 backdrop-blur-2xl text-[var(--text-main)] border-[var(--border-glass)] hover:bg-slate-900'}`}
        >
          <Plus size={24} className={`transition-transform duration-500 ${isOpen ? "rotate-[135deg]" : ""}`} />
          {count > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full  text-[10px] font-black   border-[var(--bg-app)] ${isOpen ? 'bg-[var(--bg-app)] text-[var(--text-main)]' : 'bg-[var(--text-main)] text-[var(--bg-app)]'}`}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </Motion.div>
    </div>
  );
}

function CountdownBlock({ value, label, highlight, theme }) {
  return (
    <div className="flex flex-col items-center shrink min-w-0">
      <div
        className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tabular-nums tracking-tighter leading-[0.9] ${highlight
          ? theme === 'light' ? 'text-sky-500' : 'text-sky-400 drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]'
          : 'text-[var(--text-main)] transition-colors'
          } transition-colors duration-500`}
      >
        {value}
      </div>
      <span className="text-[9px] md:text-[11px] tracking-[0.25em] uppercase font-black text-[var(--text-dim)] mt-3 shrink-0">{label}</span>
    </div>
  );
}


function RamadanProgressRing({ currentDay, hijriReadable }) {
  const dayFromText = Number.parseInt(String(hijriReadable || "").match(/\d+/)?.[0] || "", 10);
  const dayNumber = Number.parseInt(currentDay, 10);
  const normalizedSourceDay = Number.isFinite(dayNumber) && dayNumber > 0 ? dayNumber : dayFromText;
  const safeHijriReadable = (hijriReadable || "").trim() || `Day ${normalizedSourceDay || 1} Ramadan`;
  const todayHijriLabel = safeHijriReadable.includes("AH") ? safeHijriReadable : `${safeHijriReadable} AH`;
  const safeDay = Number.isFinite(normalizedSourceDay) && normalizedSourceDay > 0 ? Math.min(normalizedSourceDay, 30) : 1;
  const percentage = (safeDay / 30) * 100;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full max-w-2xl px-1 mt-4"
    >
      <div className="glass-card rounded-[2rem] p-6 md:p-8 flex items-center justify-between border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/6 via-transparent to-emerald-500/4 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400/80 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            Ramadan Journey
          </p>
          <h4 className="text-2xl md:text-3xl font-black text-[var(--text-main)] italic leading-none mb-1">
            DAY <span className="text-sky-400">{safeDay}</span> <span className="text-[var(--text-dim)] font-light text-xl">/ 30</span>
          </h4>
          <p className="text-[10px] text-[var(--text-dim)] font-bold mt-2">{todayHijriLabel}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
            {safeDay >= 30 ? "🎉 Ramadan Complete! Eid Mubarak!" : `${30 - safeDay} days remaining`}
          </p>
        </div>

        <div className="relative w-24 h-24 shrink-0">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full blur-md bg-sky-500/10 scale-110" />
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle
              className="stroke-current text-white/5"
              strokeWidth="7"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
            <circle
              stroke="url(#ringGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              className="ring-progress"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))"
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black text-[var(--text-main)]">{Math.round(percentage)}%</span>
          </div>
        </div>
      </div>
    </Motion.div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-thin text-sky-400/20 select-none shrink-0 pb-4">:</div>
  );
}

function TimingTile({ icon, label, time, active, theme }) {
  const isIftar = label === "IFTAR";
  return (
    <div className={`group p-4 sm:p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col items-center justify-center ${active
      ? isIftar
        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_20px_40px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20'
        : 'bg-sky-500/10 border-sky-500/30 shadow-[0_20px_40px_rgba(56,189,248,0.18)] ring-1 ring-sky-500/20'
      : 'bg-[var(--surface-glass)] border-[var(--border-glass)] opacity-55 hover:opacity-100 hover:bg-[var(--surface-glass-hover)] hover:scale-[1.02]'
      }`}>
      {active && (
        <>
          <div className={`absolute inset-0 pointer-events-none ${isIftar
            ? 'bg-gradient-to-br from-emerald-400/8 via-transparent to-emerald-400/3'
            : 'bg-gradient-to-br from-sky-400/8 via-transparent to-sky-400/3'
            }`} />
          <span className="absolute top-4 right-4 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isIftar ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px_rgba(56,189,248,0.8)] ${isIftar ? 'bg-emerald-400' : 'bg-sky-400'}`} />
          </span>
        </>
      )}
      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl mb-3 sm:mb-4 md:mb-5 transition-all duration-500 group-hover:scale-110 ${active
        ? isIftar
          ? theme === 'light' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40' : 'bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/30'
          : theme === 'light' ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/40' : 'bg-sky-400 text-slate-950 shadow-xl shadow-sky-400/30'
        : 'bg-white/5 text-[var(--text-dim)]'
        }`}>
        {safeClone(icon, { size: active ? 20 : 18 })}
      </div>
      <p className={`text-[8px] sm:text-[10px] md:text-[11px] font-black tracking-[.28em] uppercase mb-1.5 sm:mb-2 ${active
        ? isIftar
          ? theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'
          : theme === 'light' ? 'text-sky-600' : 'text-sky-400'
        : 'text-[var(--text-dim)]'
        }`}>{label}</p>
      <p className={`text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter ${active ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
        }`}>{time}</p>
    </div>
  );
}


// --- Page: Home (Main Tracker) ---

function Home({ data, loading, onRetry, errorMessage, cityName, mockData, setData, setUsingMockData, theme, setTheme, installPrompt, handleInstall, isOnline }) {
  const defaultChecklist = useMemo(
    () => ({ fasting: false, prayers: false, taraweeh: false, quran: false, charity: false }),
    []
  );
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
  const [activeDhikr, setActiveDhikr] = useState(() => readJsonStorage("active_dhikr", dhikrOptions[0]));
  useEffect(() => { localStorage.setItem('active_dhikr', JSON.stringify(activeDhikr)); }, [activeDhikr]);

  // New Features State
  const [juzProgress, setJuzProgress] = useState(() => readNumberStorage("quran_juz", 0));
  const [charityProgress, setCharityProgress] = useState(() => readNumberStorage("charity_goal", 0));
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
  const [tasbeehRecords, setTasbeehRecords] = useState(() => readJsonStorage("tasbeeh_records", {}));
  useEffect(() => { localStorage.setItem('tasbeeh_records', JSON.stringify(tasbeehRecords)); }, [tasbeehRecords]);

  const count = tasbeehRecords[activeDhikr.english] || 0;
  const incrementCount = () => setTasbeehRecords(prev => ({ ...prev, [activeDhikr.english]: (prev[activeDhikr.english] || 0) + 1 }));
  const resetCount = () => setTasbeehRecords(prev => ({ ...prev, [activeDhikr.english]: 0 }));

  // Checklist logic
  const [today, setToday] = useState(getTodayString);
  const [checklist, setChecklist] = useState(() => readJsonStorage(`checklist_${getTodayString()}`, defaultChecklist));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTodayString();
      setToday((prev) => (prev === next ? prev : next));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setChecklist(readJsonStorage(`checklist_${today}`, defaultChecklist));
  }, [today, defaultChecklist]);

  useEffect(() => {
    localStorage.setItem(`checklist_${today}`, JSON.stringify(checklist));
  }, [checklist, today]);

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
    const updateCountdown = () => {
      const snapshot = getCountdownSnapshot(data, new Date());
      setTodayData(snapshot.todayData);
      setCurrentStatus(snapshot.currentStatus);
      setTimeLeft(snapshot.timeLeft);
      setTimeProgress(snapshot.timeProgress);
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
      <div className="relative z-10 w-full h-screen flex items-center justify-center bg-[var(--bg-app)] transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-dim)]">Timing Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || !todayData) {
    return (
      <div className="relative z-10 w-full h-screen px-6 py-8 flex items-center justify-center bg-[var(--bg-app)] transition-colors duration-500">
        <div className="glass-card w-full max-w-sm rounded-[3rem] border border-[var(--border-glass)] p-10 text-center shadow-2xl backdrop-blur-xl bg-[var(--surface-glass)]">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border-glass)] bg-[var(--surface-glass)] text-rose-400">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-[var(--text-main)] italic mb-3">CONNECTION <span className="text-rose-400">ERROR</span></h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-8">
            {errorMessage || "We couldn't retrieve the Ramadan schedule. Please check your connection."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full py-4 rounded-2xl bg-[var(--text-main)] text-[var(--bg-app)] font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
            <button
              onClick={() => {
                setData(mockData);
                setUsingMockData(true);
              }}
              className="w-full py-4 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border-glass)] text-[var(--text-main)] font-black uppercase tracking-widest text-[10px] hover:bg-[var(--surface-glass-hover)]"
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
      {/* ── First fold: fills exactly 100vh ── */}
      <div className="w-full max-w-5xl px-5 flex flex-col" style={{ minHeight: '100dvh', height: '100dvh' }}>

        {/* ── Header ── */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3 pt-4 pb-3 md:pt-5 md:pb-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-0.5">
              <span className="text-2xl select-none animate-float" aria-hidden>🌙</span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none text-[var(--text-main)] italic">
                RAMADAN <span className="text-sky-500 font-black">{data.ramadan_year?.split(" /")[0] || data.ramadan_year}</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
              <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] font-black tracking-[.28em] uppercase">{todayData.hijri_readable}</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[9px] font-black text-sky-400/90 uppercase tracking-widest shadow-sm">
                <MapPin size={9} className="text-sky-400" /> {cityName || "Your Location"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-hover)] border border-[var(--border-glass)] text-[var(--text-main)] transition-all duration-300 shadow-lg hover:-translate-y-0.5"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {installPrompt && (
              <button
                onClick={handleInstall}
                className="group flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-[9px] font-black tracking-[.15em] uppercase text-emerald-400 transition-all duration-300 shadow-lg hover:-translate-y-0.5"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            <Link
              to="/ramadan"
              className="group flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 px-4 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black tracking-[.18em] uppercase text-sky-400 transition-all duration-300 shadow-lg hover:-translate-y-0.5"
            >
              <CalendarDays size={14} className="group-hover:text-sky-300 transition-colors" /> CALENDAR
            </Link>
          </div>
        </div>


        {/* --- PWA Status & Install Promo --- */}
        <AnimatePresence>
          {!isOnline && (
            <Motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full mb-4"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                <AlertCircle size={14} /> Offline Mode: Using Cached Data
              </div>
            </Motion.div>
          )}

        </AnimatePresence>

        <div className="flex-1 w-full flex flex-col items-center gap-0 min-h-0 pb-3">
          {/* ── Countdown Card — fills remaining vh ── */}
          <Motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex-1 glass-card-hero rounded-[2.5rem] p-5 md:p-8 flex flex-col items-center justify-between relative overflow-hidden min-h-0"
          >
            {/* Dramatic ambient glows */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/12 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Progress bar */}
            <div className="w-full max-w-lg mb-3 md:mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase tracking-[0.45em] font-black text-sky-400/60">Day Progress</span>
                <span className="text-[10px] font-black tabular-nums text-sky-400/80">{Math.round(timeProgress)}%</span>
              </div>
              <div className="h-[5px] rounded-full bg-white/5 overflow-hidden">
                <Motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 shadow-[0_0_16px_rgba(56,189,248,0.5)]"
                  animate={{ width: `${timeProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Status label */}
            <div className="flex items-center gap-3 mb-3 md:mb-5">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-sky-400/40" />
              <span className={`text-[10px] font-black tracking-[0.55em] uppercase ${theme === 'light' ? 'text-sky-600' : 'text-sky-400/70'}`}>
                {currentStatus === "iftar" ? "⬇ Until Iftar" : "⬆ Until Sahur"}
              </span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-sky-400/40" />
            </div>

            {/* Digits */}
            <div className="flex items-center justify-center gap-3 md:gap-8 mb-4 md:mb-8">
              <CountdownBlock value={timeLeft.h} label="Hrs" theme={theme} />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.m} label="Min" theme={theme} />
              <CountdownSeparator />
              <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} theme={theme} />
            </div>

            {/* Timing tiles */}
            <div className="grid grid-cols-2 gap-3 md:gap-5 w-full max-w-2xl">
              <TimingTile icon={<Clock />} label="SAHUR" time={todayData?.time ? formatTo12Hour(todayData.time.sahur) : "--:--"} active={currentStatus === "sahur"} theme={theme} />
              <TimingTile icon={<Sun />} label="IFTAR" time={todayData?.time ? formatTo12Hour(todayData.time.iftar) : "--:--"} active={currentStatus === "iftar"} theme={theme} />
            </div>
          </Motion.div>

        </div>
      </div>

      {/* ── Below the fold: scrollable content ── */}
      <div className="w-full max-w-5xl px-5 pb-4 flex flex-col items-center gap-4">
          {/* ── Ramadan Progress Ring ── */}
          <RamadanProgressRing currentDay={todayData?.day} hijriReadable={todayData?.hijri_readable} />

          {/* ── Daily Inspiration ── */}
          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="w-full max-w-2xl px-1 mt-2">
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-violet-500/8 border border-sky-500/15 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                <Sparkles size={72} className="text-sky-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400/90 mb-3 flex items-center gap-2">
                <Sparkles size={11} /> Daily Inspiration
              </p>
              <p className="text-sm md:text-base font-medium italic text-[var(--text-main)] leading-relaxed mb-4 opacity-90">&ldquo;{inspiration.text}&rdquo;</p>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-dim)]">&mdash; {inspiration.source}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`"${inspiration.text}" — ${inspiration.source}`); }}
                  className="text-[8px] font-black uppercase tracking-widest text-sky-500/60 hover:text-sky-400 transition-colors px-3 py-1 rounded-lg hover:bg-sky-500/10"
                >Copy</button>
              </div>
            </div>
          </Motion.div>

          {/* ── Spiritual Hub ── */}
          <div className="w-full max-w-2xl px-1 mt-8 mb-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-glass)] to-transparent" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--text-dim)]">Spiritual Hub</h3>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-glass)] to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ToolkitItem color="amber" icon={<Info />} label="99 Names" onClick={() => setShowNames(true)} theme={theme} />
              <ToolkitItem color="emerald" icon={<Plus />} label="Zakat Calc" onClick={() => setShowZakat(true)} theme={theme} />
              <ToolkitItem color="indigo" icon={<BookOpen />} label="Daily Duas" onClick={() => setShowDua(true)} theme={theme} />
              <ToolkitItem color="rose" icon={<AlertCircle />} label="Mood Dua" onClick={() => setShowMoods(true)} theme={theme} />
              <ToolkitItem color="sky" icon={<BookOpen />} label="Quran Journey" progress={(juzProgress / 30) * 100} onClick={() => setShowQuran(true)} theme={theme} />
              <ToolkitItem color="violet" icon={<Heart />} label="Charity Jar" progress={charityProgress} onClick={() => setShowCharity(true)} theme={theme} />
              <ToolkitItem color="indigo" icon={<Moon />} label="Night of Power" onClick={() => setShowQadr(true)} theme={theme} />
            </div>
          </div>

          {/* ── SEO Content ── */}
          <section className="w-full max-w-2xl px-1 mt-6 mb-6">
            <div className="p-6 rounded-[2rem] bg-[var(--surface-glass)] border border-[var(--border-glass)]">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                Sehri Countdown & Iftar Countdown
              </h2>
              <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed mt-3">
                Track the live Sehri countdown and Iftar countdown with second-by-second updates. If you search
                "how many seconds till iftar" or want a precise Sehri/Suhoor timer, this page shows the exact time left
                based on your current location.
              </p>
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-[0.35em] text-[var(--text-dim)] mt-5">
                Suhoor Time, Sehri Time Today, Iftar Time Today
              </h3>
              <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed mt-3">
                Use the location badge at the top to get today's Sehri (Suhoor) time and Iftar time for your city.
                The monthly schedule page includes all 30 days of Ramadan 2026 so you can plan Sehri and Iftar timings
                ahead for your area.
              </p>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="w-full max-w-2xl px-2 pt-6 pb-28 border-t border-[var(--border-glass)] text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--text-dim)] mb-1">
              Made with ❤️ for Muslims everywhere &nbsp;·&nbsp; رمضان مبارك
            </p>
            <p className="text-[7.5px] text-[var(--text-dim)] opacity-60 tracking-widest uppercase">
              MIT License &nbsp;·&nbsp; © 2026 Abdullah Warraich
            </p>
          </footer>

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
            <div className="modal-backdrop">
              <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm glass-card rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-400 shadow-lg" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.08),_transparent_70%)] pointer-events-none" />
                <button onClick={() => setShowQadr(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>

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
                          <p className="text-3xl font-black text-[var(--text-main)]">Night {nextQadrNight}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 mt-1">Increase your ibadah tonight!</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 mb-2">Next Possible Night</p>
                          <p className="text-6xl font-black text-[var(--text-main)]">{daysUntil}</p>
                          <p className="text-sm font-black text-violet-300">{daysUntil === 1 ? 'day' : 'days'} until Night <span className="text-[var(--text-main)]">{nextQadrNight}</span></p>
                        </>
                      )}
                    </div>

                    <div className="w-full">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] mb-3 text-center">The Odd Nights</p>
                      <div className="grid grid-cols-5 gap-2">
                        {qadrNights.map(night => (
                          <div key={night} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${currentRamadanDay && currentRamadanDay > night
                            ? 'bg-[var(--surface-glass)] border-[var(--border-glass)] opacity-30'
                            : night === nextQadrNight && daysUntil === 0
                              ? 'bg-violet-500/20 border-violet-400/50 ring-1 ring-violet-400/30'
                              : 'bg-[var(--surface-glass)] border-[var(--border-glass)]'
                            }`}>
                            <Moon size={12} className={night === nextQadrNight ? 'text-violet-400' : 'text-[var(--text-dim)]'} />
                            <span className={`text-xs font-black mt-1 ${night === nextQadrNight ? 'text-violet-300' : 'text-[var(--text-muted)]'}`}>{night}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-[2rem] bg-[var(--surface-glass)] border border-[var(--border-glass)] text-center">
                    <div className="text-4xl mb-3">🤲</div>
                    <p className="text-sm font-black text-[var(--text-muted)]">All 5 blessed nights have passed.</p>
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
              <button onClick={() => setShowTasbih(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-[var(--surface-glass)] text-[var(--text-muted)] hover:bg-[var(--surface-glass-hover)] hover:text-[var(--text-main)] transition-all">
                <X size={16} />
              </button>

              <p className="text-[9px] font-black tracking-[.45em] uppercase text-[var(--text-dim)] mb-1 mt-2">Digital Tasbih</p>
              <h3 className="text-lg font-black mb-6">COUNT YOUR <span className={`${theme === 'light' ? 'text-sky-600' : 'text-sky-300'}`}>DHIKR</span></h3>

              {/* Dhikr selector */}
              <div className="w-full flex overflow-x-auto gap-2.5 mb-7 pb-2 custom-scrollbar-horizontal scroll-smooth">
                {dhikrOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveDhikr(option)}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl border transition-all ${activeDhikr.arabic === option.arabic
                      ? theme === 'light' ? 'bg-sky-600 border-sky-500 text-white shadow-[0_4px_20px_rgba(12,74,110,0.2)]' : 'bg-sky-500 border-sky-400 text-white shadow-[0_4px_20px_rgba(125,211,252,0.3)]'
                      : 'bg-[var(--surface-glass)] border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--border-glass-hover)] hover:text-[var(--text-main)]'
                      }`}
                  >
                    <span className="font-arabic text-base block mb-0.5">{option.arabic}</span>
                    <span className="text-[8px] uppercase tracking-widest opacity-60">{option.english}</span>
                  </button>
                ))}
              </div>

              {/* Big counter */}
              <div className="flex flex-col items-center mb-7">
                <p className={`text-2xl font-arabic mb-1 ${theme === 'light' ? 'text-sky-600/80' : 'text-sky-200/70'}`}>{activeDhikr.arabic}</p>
                <div className="text-[7rem] font-black tabular-nums leading-none text-[var(--text-main)] drop-shadow-[0_0_30px_rgba(125,211,252,0.2)]">
                  {count}
                </div>
                <p className="text-[9px] uppercase tracking-[0.35em] font-black text-[var(--text-dim)] mt-1">× {activeDhikr.english}</p>
              </div>

              {/* Tap button */}
              <Motion.button
                whileTap={{ scale: 0.94, boxShadow: "0 0 0 24px rgba(125,211,252,0)" }}
                onClick={incrementCount}
                className={`w-full py-9 rounded-[2rem] font-black text-5xl flex items-center justify-center mb-4 transition-colors shadow-lg ${theme === 'light' ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-500/20' : 'bg-sky-500 text-white hover:bg-sky-400 shadow-sky-500/10'}`}
              >
                <Plus size={44} strokeWidth={3} />
              </Motion.button>

              <button
                onClick={resetCount}
                className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.35em] text-[var(--text-dim)] hover:text-rose-400/80 transition-colors"
              >Reset Counter</button>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChecklist && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-lg" /><button onClick={() => setShowChecklist(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <div className="text-center mb-10"><p className="text-[10px] font-black tracking-[.4em] uppercase text-[var(--text-dim)] mb-2">Progress</p><h3 className="text-2xl font-black italic">DAILY <span className={`${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>DEEDS</span></h3></div>
              <div className="w-full space-y-3">
                {[{ id: 'fasting', label: 'Fasting', icon: <Sun size={14} /> }, { id: 'prayers', label: 'Prayers', icon: <Clock size={14} /> }, { id: 'taraweeh', label: 'Taraweeh', icon: <Check size={14} /> }, { id: 'quran', label: 'Recitation', icon: <BookOpen size={14} /> }, { id: 'charity', label: 'Sadaqah', icon: <Plus size={14} /> }].map(t => (
                  <button key={t.id} onClick={() => toggleTask(t.id)} className={`w-full p-5 rounded-3xl border transition-all flex items-center justify-between ${checklist[t.id] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--surface-glass)] border-[var(--border-glass)]'}`}>
                    <div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${checklist[t.id] ? theme === 'light' ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-black' : 'bg-[var(--surface-glass-hover)]'}`}>{t.icon}</div><span className="text-xs font-black uppercase text-[var(--text-main)]">{t.label}</span></div>
                    {checklist[t.id] && <Check size={18} className={`${theme === 'light' ? 'text-emerald-600' : 'text-emerald-500'}`} />}
                  </button>
                ))}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNames && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" /><button onClick={() => { setShowNames(false); setActiveName(null); }} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <AnimatePresence mode="wait">
                {!activeName ? (
                  <Motion.div key="g">
                    <h3 className="text-center text-2xl font-black italic mb-8">99 NAMES OF <span className="text-emerald-500">ALLAH</span></h3>
                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar border-[var(--border-glass)]">
                      {allahNames.map((n, i) => (<button key={i} onClick={() => setActiveName(n)} className="p-5 rounded-3xl bg-[var(--surface-glass)] border border-[var(--border-glass)] hover:bg-emerald-500/10"><span className="text-3xl font-arabic mb-2 block text-[var(--text-main)]">{n.arabic}</span><span className="text-[10px] font-black uppercase text-emerald-500/60">{n.transliteration}</span></button>))}
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div key="d" className="text-center py-10">
                    <button onClick={() => setActiveName(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500/50 hover:text-emerald-500 transition-colors"><ChevronLeft size={16} /> Back</button>
                    <div className="text-8xl font-arabic mb-10 text-[var(--text-main)]">{activeName.arabic}</div>
                    <div className="text-xs font-black uppercase text-emerald-500 tracking-[0.3em] mb-4">{activeName.transliteration}</div>
                    <div className="text-2xl font-black italic text-[var(--text-main)] mb-10">"{activeName.meaning}"</div>
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
              <button onClick={() => setShowZakat(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-[var(--surface-glass)] text-[var(--text-muted)] hover:bg-[var(--surface-glass-hover)] hover:text-[var(--text-main)] transition-all">
                <X size={16} />
              </button>

              <p className="text-[9px] font-black tracking-[.45em] uppercase text-[var(--text-dim)] mb-1 mt-2">Calculator</p>
              <h3 className="text-lg font-black mb-6">ZAKAT <span className="text-amber-500">DUE</span></h3>

              <div className="space-y-3 mb-5">
                {[
                  { key: "cash", label: "Cash & Bank", placeholder: "0" },
                  { key: "gold", label: "Gold & Silver", placeholder: "0" },
                  { key: "investments", label: "Investments", placeholder: "0" },
                  { key: "debts", label: "Debts (deduct)", placeholder: "0" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[8px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)] mb-1.5 ml-1">{label}</label>
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
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black uppercase tracking-widest text-[10px] transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.3)] mb-4"
              >Calculate Zakat</button>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest mb-1">Your Zakat Due (2.5%)</p>
                <p className="text-4xl font-black text-amber-500 tabular-nums">{zakatResult.toFixed(2)}</p>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDua && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" /><button onClick={() => setShowDua(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <h3 className="text-xl font-black italic mb-8">DAILY <span className={`${theme === 'light' ? 'text-sky-600' : 'text-sky-300'}`}>DUAS</span></h3>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {duas.map((d, i) => (<div key={i} className="p-5 rounded-3xl bg-[var(--surface-glass)] border border-[var(--border-glass)]"><p className={`text-[10px] font-black uppercase mb-3 ${theme === 'light' ? 'text-sky-600' : 'text-sky-400/60'}`}>{d.title}</p><p className="text-2xl text-right font-arabic leading-relaxed mb-4 text-[var(--text-main)]">{d.arabic}</p><p className="text-xs text-[var(--text-muted)] italic">"{d.english}"</p></div>))}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoods && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" /><button onClick={() => { setShowMoods(false); setActiveMoodDua(null); }} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <AnimatePresence mode="wait">
                {!activeMoodDua ? (
                  <Motion.div key="s" className="w-full flex flex-col items-center">
                    <h3 className="text-xl font-black italic mb-8">DUA <span className="text-rose-400">FINDER</span></h3>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {moodDuas.map((m, i) => (<button key={i} onClick={() => setActiveMoodDua(m)} className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-[var(--surface-glass)] border border-[var(--border-glass)] hover:bg-rose-500/10 transition-colors"><span className="text-3xl">{m.emoji}</span><span className="text-[10px] font-black uppercase text-[var(--text-dim)]">{m.mood}</span></button>))}
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div key="d" className="w-full flex flex-col items-center text-center">
                    <button onClick={() => setActiveMoodDua(null)} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-rose-400/40 self-start"><ChevronLeft size={14} /> Back</button>
                    <div className="text-4xl mb-6">{activeMoodDua.emoji}</div>
                    <p className="text-2xl font-arabic leading-relaxed text-[var(--text-main)] mb-6 uppercase">{activeMoodDua.arabic}</p>
                    <p className="text-sm text-[var(--text-muted)] italic font-medium">"{activeMoodDua.english}"</p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuran && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-sky-500" /><button onClick={() => setShowQuran(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <div className="text-center mb-10"><h3 className="text-2xl font-black italic">QURAN <span className={`${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>JOURNEY</span></h3><p className="text-[10px] text-[var(--text-dim)] uppercase font-black">Track your progress through Juz</p></div>
              <div className="relative h-40 w-40 mx-auto mb-10 flex items-center justify-center border-[var(--border-glass)] border rounded-full">
                <div className="text-center"><p className="text-5xl font-black text-[var(--text-main)]">{juzProgress}</p><p className="text-[10px] text-[var(--text-dim)] uppercase font-black">Juz Read</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setJuzProgress(p => Math.max(0, p - 1))} className="py-4 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border-glass)] font-black uppercase text-[10px] text-[var(--text-main)] hover:bg-[var(--surface-glass-hover)] transition-colors">- Decrease</button>
                <button onClick={() => setJuzProgress(p => Math.min(30, p + 1))} className={`py-4 rounded-2xl font-black uppercase text-[10px] transition-colors ${theme === 'light' ? 'bg-sky-600 text-white' : 'bg-sky-500 text-black'}`}>+ Increase</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCharity && (
          <div className="modal-backdrop">
            <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm glass-card rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-violet-500" /><button onClick={() => setShowCharity(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={20} /></button>
              <div className="text-center mb-10"><h3 className="text-2xl font-black italic">CHARITY <span className={`${theme === 'light' ? 'text-violet-600' : 'text-violet-400'}`}>JAR</span></h3><p className="text-[10px] text-[var(--text-dim)] uppercase font-black">Track your Ramadan Sadaqah</p></div>
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-[var(--surface-glass)] border border-[var(--border-glass)] text-center relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full bg-violet-500/20" style={{ height: `${charityProgress}%` }} />
                  <div className="relative z-10"><p className="text-[10px] font-black text-[var(--text-dim)] uppercase mb-2">Completion</p><p className={`text-5xl font-black ${theme === 'light' ? 'text-violet-600' : 'text-violet-400'}`}>{charityProgress}%</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setCharityProgress(p => Math.max(0, p - 5))} className="py-4 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border-glass)] font-black uppercase text-[10px] text-[var(--text-main)] hover:bg-[var(--surface-glass-hover)] transition-colors">- 5%</button>
                  <button onClick={() => setCharityProgress(p => Math.min(100, p + 5))} className={`py-4 rounded-2xl font-black uppercase text-[10px] transition-colors ${theme === 'light' ? 'bg-violet-600 text-white' : 'bg-violet-500 text-black'}`}>+ 5%</button>
                </div>
                <button onClick={() => setCharityProgress(0)} className="w-full py-2 text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.4em] hover:text-rose-500 transition-colors">Reset Jar</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Page: RamadanCalendar ---

function RamadanCalendar({ data, loading, theme }) {
  const navigate = useNavigate();

  if (loading) return null;

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="glass-card rounded-[3rem] p-10 text-center max-w-sm border-white/5 shadow-2xl">
          <p className="text-[var(--text-muted)] mb-6 text-sm font-medium tracking-wide">Calendar is unavailable right now. Please return home and try again.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl bg-[var(--text-main)] text-[var(--bg-app)] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const today = getTodayString();

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 w-full h-full max-w-5xl mx-auto px-4 md:px-8 py-10 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-12">
        <Link 
          to="/" 
          className="p-3.5 bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-hover)] border border-[var(--border-glass)] rounded-2xl transition-all shadow-xl group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-gradient">Monthly <span className="text-sky-500">Schedule</span></h1>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[var(--text-dim)] mt-2">Ramadan {data.ramadan_year?.split(" /")[0] || data.ramadan_year}</p>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar pb-8 px-1">
        <table className="calendar-table min-w-[750px]">
          <thead>
            <tr>
              <th>Day</th>
              <th>Hijri Date</th>
              <th>Date</th>
              <th>Sahur</th>
              <th>Iftar</th>
            </tr>
          </thead>
          <tbody>
            {data.fasting.map((day, idx) => {
              const isToday = day.date === today;
              return (
                <tr key={day.date ?? idx} className={isToday ? "is-today" : ""}>
                    <td>
                        <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${isToday ? 'bg-sky-500 text-white shadow-sky-500/20' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                                {idx + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-sky-400' : 'text-[var(--text-dim)]'}`}>
                                    {day.day.substring(0, 3)}
                                </span>
                                {isToday && (
                                    <span className="text-[7px] bg-sky-500 text-white px-1.5 py-0.5 rounded-md font-black tracking-tighter uppercase mt-0.5 w-fit">Today</span>
                                )}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span className={`text-sm font-bold tracking-tight ${isToday ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                            {day.hijri_readable?.split(" AH")[0] || day.date_hijri || "N/A"}
                        </span>
                    </td>
                    <td>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-dim)] whitespace-nowrap">
                            {day.date}
                        </span>
                    </td>
                    <td>
                        <div className="flex flex-col">
                            <span className={`text-xl font-black tracking-tighter ${isToday ? 'text-sky-400' : 'text-[var(--text-main)]'}`}>
                                {formatTo12Hour(day.time.sahur)}
                            </span>
                        </div>
                    </td>
                    <td>
                        <div className="flex flex-col">
                            <span className={`text-xl font-black tracking-tighter ${isToday ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                                {formatTo12Hour(day.time.iftar)}
                            </span>
                        </div>
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="w-full max-w-3xl mt-2 px-2 text-center">
        <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
          This Ramadan 2026 calendar lists all 30 days with daily Sehri (Suhoor) and Iftar timings so you can plan
          your fasting schedule in advance for your city.
        </p>
      </div>
    </Motion.div>
  );
}


// --- Main App Component ---

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("ramadan_theme") || "dark");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cityName, setCityName] = useState("");
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [, setUsingMockData] = useState(false);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Auto-show modal after a delay if not dismissed this session and not already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!isStandalone && sessionStorage.getItem("pwa_modal_dismissed") !== "true") {
        setTimeout(() => setShowInstallModal(true), 3000);
      }
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setShowInstallModal(false);
    }
  };

  const dismissInstallModal = () => {
    setShowInstallModal(false);
    sessionStorage.setItem("pwa_modal_dismissed", "true");
  };

  useEffect(() => {
    localStorage.setItem("ramadan_theme", theme);
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [theme]);

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
      <div className="h-screen w-full bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center px-6 transition-colors duration-500">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-card rounded-[2.5rem] p-10 text-center"
        >
          <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <MapPin size={26} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wide mb-3 text-[var(--text-main)]">Location Required</h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8">
            {error || "Please allow location access so we can load accurate Sehri & Iftar timings for your city."}
          </p>
          <button
            onClick={fetchRamadanData}
            className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
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
      <div className="min-h-screen w-full relative selection:bg-sky-500/30 transition-colors duration-500">
        <DecorativeGlows theme={theme} />
        
        <div className="relative z-10 w-full min-h-screen overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {showInstallModal && !locationPermissionDenied && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/40 backdrop-blur-md">
                <Motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-sm bg-slate-950/98 backdrop-blur-2xl rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/5"
                >
                  <button onClick={dismissInstallModal} className="absolute top-8 right-8 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                    <X size={20} />
                  </button>

                  <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-sky-500/20 blur-2xl rounded-full" />
                    <img src="/icons/icon-512.png" alt="App Icon" className="relative h-24 w-24 rounded-[2rem] shadow-2xl border border-white/10" />
                  </div>

                  <div className="text-center mb-8">
                    <p className="text-[10px] font-black tracking-[.4em] uppercase text-sky-400 mb-2">PWA INSTALL</p>
                    <h3 className="text-2xl font-black text-[var(--text-main)] italic">RAMADAN <span className="text-sky-400">JOURNEY</span></h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-3 leading-relaxed">
                      Install our app for a faster experience and offline access to timings.
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <button
                      onClick={handleInstall}
                      className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
                    >
                      Install App Now
                    </button>
                    <button
                      onClick={dismissInstallModal}
                      className="w-full py-4 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border-glass)] text-[var(--text-main)] font-black uppercase tracking-widest text-[10px] hover:bg-[var(--surface-glass-hover)] transition-all"
                    >
                      Maybe Later
                    </button>
                  </div>
                </Motion.div>
              </div>
            )}
          </AnimatePresence>

          <Routes>
            <Route path="/" element={<Home data={data} loading={loading} onRetry={fetchRamadanData} errorMessage={error} cityName={cityName} mockData={mockData} setData={setData} setUsingMockData={setUsingMockData} theme={theme} setTheme={setTheme} installPrompt={installPrompt} handleInstall={handleInstall} isOnline={isOnline} />} />
            <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} onRetry={fetchRamadanData} errorMessage={error} theme={theme} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
