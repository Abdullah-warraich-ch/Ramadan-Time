import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, Sun, ChevronLeft, RefreshCw, CalendarDays, Check, Navigation, MapPin, Share2, Plus, BookOpen, RotateCcw, X, Info, Search } from "lucide-react";
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

function writeScheduleCache(data, timestamp) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));
  } catch {
    // Ignore cache write failures (quota/private mode).
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

function FloatingActionMenu({ onShare, shareStatus, onRefresh, ramadanYear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDua, setShowDua] = useState(false);
  const [showTasbih, setShowTasbih] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showMoods, setShowMoods] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [showZakat, setShowZakat] = useState(false);
  const [activeMoodDua, setActiveMoodDua] = useState(null);
  const [activeName, setActiveName] = useState(null);

  // Zakat Calculator State
  const [zakatInputs, setZakatInputs] = useState({ cash: "", gold: "", silver: "", investments: "", debts: "" });
  const [zakatResult, setZakatResult] = useState(0);

  const calculateZakat = () => {
    const total = (Number(zakatInputs.cash) || 0) + (Number(zakatInputs.gold) || 0) + (Number(zakatInputs.silver) || 0) + (Number(zakatInputs.investments) || 0) - (Number(zakatInputs.debts) || 0);
    setZakatResult(Math.max(0, total * 0.025));
  };

  // Persistence: Tasbih
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('tasbih_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('tasbih_count', count.toString());
  }, [count]);

  // Checklist logic
  const today = getTodayString();
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`checklist_${today}`);
    return saved ? JSON.parse(saved) : {
      fasting: false,
      prayers: false,
      taraweeh: false,
      quran: false,
      charity: false
    };
  });

  useEffect(() => {
    localStorage.setItem(`checklist_${today}`, JSON.stringify(checklist));
  }, [checklist, today]);

  const toggleTask = (task) => setChecklist(prev => ({ ...prev, [task]: !prev[task] }));
  const completedCount = Object.values(checklist).filter(Boolean).length;

  const containerVariants = {
    open: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const moodDuas = [
    { mood: "Anxious", emoji: "😰", arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", english: "O Allah, I seek refuge in You from anxiety and sorrow." },
    { mood: "Sad", emoji: "😔", arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", english: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers." },
    { mood: "Happy", emoji: "😊", arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", english: "All praise is for Allah by whose favor good things are perfected." },
    { mood: "Angry", emoji: "😠", arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", english: "I seek refuge in Allah from the accursed devil." }
  ];

  const dailySunnah = "Smiling at your brother is an act of charity (Sadaqah).";

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

  const duas = [
    { title: "Dua for Fasting", arabic: "وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ", english: "I intend to keep the fast for tomorrow in the month of Ramadan." },
    { title: "Dua for Breaking Fast", arabic: "اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", english: "O Allah! I fasted for You and I believe in You and I put my trust in You and with Your sustenance I break my fast." },
    { title: "Dua for Forgiveness", arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", english: "O Allah, You are Most Forgiving, and You love forgiveness; so forgive me." }
  ];

  return (
    <>
      <div className="fixed bottom-10 right-10 z-50">
        <motion.div
          animate={isOpen ? { scale: 1.5, opacity: 1 } : { scale: 0, opacity: 0 }}
          className="absolute -inset-10 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div variants={containerVariants} initial="closed" animate={isOpen ? "open" : "closed"} className="relative">
          <motion.button
            custom={-90} variants={itemVariants}
            onClick={() => { setShowTasbih(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-sky-500/20 hover:border-sky-500/50 transition-colors"
          >
            <Clock size={16} className="group-hover:text-sky-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Tasbih</span>
          </motion.button>

          <motion.button
            custom={-110} variants={itemVariants}
            onClick={() => { setShowChecklist(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
          >
            <Check size={16} className="group-hover:text-emerald-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Deeds</span>
          </motion.button>

          <motion.button
            custom={-130} variants={itemVariants}
            onClick={() => { setShowZakat(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
          >
            <Plus size={16} className="group-hover:text-amber-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Zakat</span>
          </motion.button>

          <motion.button
            custom={-150} variants={itemVariants}
            onClick={() => { setShowMoods(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors"
          >
            <AlertCircle size={16} className="group-hover:text-rose-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Mood</span>
          </motion.button>

          <motion.button
            custom={-170} variants={itemVariants}
            onClick={() => { setShowNames(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
          >
            <Info size={16} className="group-hover:text-amber-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Names</span>
          </motion.button>

          {/* Dua Button */}
          <motion.button
            custom={-190} variants={itemVariants}
            onClick={() => { setShowDua(true); setIsOpen(false); }}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-colors"
          >
            <BookOpen size={16} className="group-hover:text-indigo-300 transition-colors" />
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Duas</span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            custom={-210} variants={itemVariants} onClick={onShare}
            className="absolute h-12 w-12 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl text-white shadow-2xl flex flex-col items-center justify-center group hover:bg-white/10 transition-colors"
          >
            {shareStatus === "idle" ? <Share2 size={16} /> : <Check size={16} className="text-emerald-400" />}
            <span className="text-[5px] font-black uppercase opacity-40 mt-0.5">Share</span>
          </motion.button>

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
        </motion.div>
      </div>

      {/* Tasbih Modal */}
      <AnimatePresence>
        {showTasbih && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-sm glass-card rounded-[3rem] border-white/15 p-10 flex flex-col items-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-sky-500 shadow-[0_4px_20px_rgba(56,189,248,0.4)]" />

              <button onClick={() => setShowTasbih(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
                <X size={20} />
              </button>

              <div className="text-center mb-12">
                <p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Digital Tasbih</p>
                <h3 className="text-xl font-black text-white italic">COUNT YOUR <span className="text-sky-300">DHIKR</span></h3>
              </div>

              <div className="relative mb-10">
                <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-[80px]" />
                <motion.div
                  key={count} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="relative text-[11rem] font-black tracking-tighter tabular-nums leading-none text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  {count}
                </motion.div>
              </div>

              <div className="w-full flex flex-col gap-6 relative z-10">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCount(prev => prev + 1)}
                  className="w-full py-10 rounded-[2.5rem] bg-white text-black font-black text-6xl shadow-[0_20px_60px_-15px_rgba(255,255,255,0.5)] active:bg-sky-50 transition-colors"
                >
                  +
                </motion.button>

                <button
                  onClick={() => setCount(0)}
                  className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[.3em] text-white/40 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center gap-3 group"
                >
                  <RotateCcw size={16} className="group-hover:rotate-[-120deg] transition-transform" />
                  <span className="relative top-[1px]">Reset Counter</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dua Modal */}
      <AnimatePresence>
        {showDua && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card rounded-[2.5rem] border-white/15 p-8 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-emerald-500 to-sky-500" />
              <button onClick={() => setShowDua(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"><X size={20} /></button>

              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300"><BookOpen size={20} /></div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white uppercase italic">RAMADAN <span className="text-sky-300">DUAS</span></h3>
                  <p className="text-[9px] font-bold tracking-[.3em] uppercase opacity-40">Supplications for the holy month</p>
                </div>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {duas.map((dua, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors group">
                    <p className="text-[10px] font-black tracking-widest text-sky-400/60 uppercase mb-3">{dua.title}</p>
                    <p className="text-2xl md:text-3xl text-right font-arabic leading-relaxed text-white drop-shadow-lg mb-4">{dua.arabic}</p>
                    <p className="text-xs md:text-sm text-slate-400 italic font-medium leading-relaxed group-hover:text-slate-300 transition-colors">"{dua.english}"</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Info size={16} className="text-sky-300 shrink-0" /><p className="text-[10px] font-medium text-slate-400 leading-tight">These duas can be recited throughout the holy month of Ramadan {ramadanYear}.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Checklist Modal */}
      <AnimatePresence>
        {showChecklist && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-sm glass-card rounded-[3rem] border-white/15 p-10 flex flex-col items-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.4)]" />
              <button onClick={() => setShowChecklist(false)} className="absolute top-8 right-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"><X size={20} /></button>

              <div className="text-center mb-10">
                <p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Spiritual Progress</p>
                <h3 className="text-2xl font-black text-white italic">DAILY <span className="text-emerald-300">CHECKLIST</span></h3>
              </div>

              <div className="w-full space-y-3 relative z-10">
                {[
                  { id: 'fasting', label: 'Fasting Status', icon: <Sun size={14} /> },
                  { id: 'prayers', label: '5 Daily Prayers', icon: <Clock size={14} /> },
                  { id: 'taraweeh', label: 'Taraweeh Prayer', icon: <Check size={14} /> },
                  { id: 'quran', label: 'Quran Recitation', icon: <BookOpen size={14} /> },
                  { id: 'charity', label: 'Sadaqah / Charity', icon: <Plus size={14} /> }
                ].map((task) => (
                  <motion.button
                    key={task.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTask(task.id)}
                    className={`w-full p-5 rounded-3xl border transition-all flex items-center justify-between group ${checklist[task.id] ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-all ${checklist[task.id] ? 'bg-emerald-500 text-black scale-110 shadow-lg' : 'bg-white/5 text-slate-500 group-hover:text-white'}`}>
                        {task.icon}
                      </div>
                      <span className="text-xs font-black tracking-wide uppercase">{task.label}</span>
                    </div>
                    {checklist[task.id] && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={18} className="text-emerald-500" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-10 w-full p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 blur-2xl" />
                <p className="relative text-[10px] font-black text-slate-500 uppercase tracking-[.3em] mb-1">Total Completion</p>
                <p className="relative text-3xl font-black text-emerald-400 tabular-nums">{completedCount} <span className="text-sm opacity-30">/ 5</span></p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mood Selector Modal */}
      <AnimatePresence>
        {showMoods && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-sm glass-card rounded-[3rem] border-white/10 p-10 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />
              <button onClick={() => { setShowMoods(false); setActiveMoodDua(null); }} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"><X size={20} /></button>

              <AnimatePresence mode="wait">
                {!activeMoodDua ? (
                  <motion.div
                    key="selector" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="w-full flex flex-col items-center"
                  >
                    <div className="text-center mb-8">
                      <p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">How are you feeling?</p>
                      <h3 className="text-xl font-black text-white italic">DUA <span className="text-rose-400">FINDER</span></h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {moodDuas.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveMoodDua(m)}
                          className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group"
                        >
                          <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{m.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{m.mood}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 w-full text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Sunnah of the Day</p>
                      <p className="text-xs text-slate-400 italic font-medium leading-relaxed">"{dailySunnah}"</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="w-full flex flex-col items-center text-center"
                  >
                    <button onClick={() => setActiveMoodDua(null)} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400/60 hover:text-rose-400 self-start transition-colors">
                      <ChevronLeft size={14} /> Back to moods
                    </button>
                    <div className="h-20 w-20 flex items-center justify-center rounded-full bg-rose-500/10 text-4xl mb-6 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                      {activeMoodDua.emoji}
                    </div>
                    <p className="text-[10px] font-black tracking-[.3em] uppercase opacity-40 mb-4">Finding peace for {activeMoodDua.mood}</p>
                    <p className="text-2xl font-arabic leading-[1.8] text-white mb-6 drop-shadow-lg">{activeMoodDua.arabic}</p>
                    <p className="text-sm text-slate-400 italic font-medium leading-relaxed px-2">"{activeMoodDua.english}"</p>
                    <div className="mt-8 w-full h-px bg-white/5" />
                    <p className="mt-6 text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Recite this supplication with sincerity <br /> to find tranquility.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Zakat Calculator Modal */}
      <AnimatePresence>
        {showZakat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-sm glass-card rounded-[3rem] border-white/10 p-10 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
              <button onClick={() => setShowZakat(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"><X size={20} /></button>

              <div className="text-center mb-8">
                <p className="text-[10px] font-black tracking-[.4em] uppercase opacity-40 mb-2">Obligatory Charity</p>
                <h3 className="text-xl font-black text-white italic">ZAKAT <span className="text-amber-400">CALC</span></h3>
              </div>

              <div className="w-full space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-2">Cash Assets</label>
                    <input type="number" value={zakatInputs.cash} onChange={(e) => setZakatInputs({ ...zakatInputs, cash: e.target.value })} placeholder="0.00" className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-white text-sm focus:border-amber-500/50 transition-colors focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-2">Gold/Silver</label>
                    <input type="number" value={zakatInputs.gold} onChange={(e) => setZakatInputs({ ...zakatInputs, gold: e.target.value })} placeholder="0.00" className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-white text-sm focus:border-amber-500/50 transition-colors focus:outline-none" />
                  </div>
                </div>
                <button onClick={calculateZakat} className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">Calculate</button>

                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 text-center relative overflow-hidden">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Zakat Due</p>
                  <p className="text-3xl font-black text-amber-400">{zakatResult.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 99 Names Modal */}
      <AnimatePresence>
        {showNames && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/99 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-lg glass-card rounded-[3rem] border-white/15 p-10 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.4)]" />
              <button onClick={() => { setShowNames(false); setActiveName(null); }} className="absolute top-8 right-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"><X size={20} /></button>

              <AnimatePresence mode="wait">
                {!activeName ? (
                  <motion.div
                    key="names_grid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-full flex flex-col"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-black text-white italic">99 NAMES OF <span className="text-emerald-300">ALLAH</span></h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                      {allahNames.map((name, i) => (
                        <button
                          key={i} onClick={() => setActiveName(name)}
                          className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group flex flex-col items-center text-center"
                        >
                          <span className="text-3xl font-arabic text-white mb-2 group-hover:scale-110 transition-transform">{name.arabic}</span>
                          <span className="text-[10px] font-black tracking-widest text-emerald-300/60 uppercase">{name.transliteration}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="name_detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="w-full flex flex-col items-center text-center py-10"
                  >
                    <button onClick={() => setActiveName(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400/60 hover:text-emerald-400 self-start transition-colors">
                      <ChevronLeft size={16} /> Back to names
                    </button>
                    <div className="text-8xl font-arabic text-white mb-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{activeName.arabic}</div>
                    <div className="text-sm font-black tracking-[0.3em] uppercase text-emerald-400 mb-2">{activeName.transliteration}</div>
                    <div className="text-2xl font-black text-white italic mb-10">"{activeName.meaning}"</div>
                    <div className="w-full p-6 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-xs text-slate-400 italic">"He is Allah, the Creator, the Inventor, the Fashioner; to Him belong the best names." (59:24)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <p className={`text-[6px] sm:text-[8px] md:text-[9px] lg:text-[11px] font-black tracking-[.1em] sm:tracking-[.2em] uppercase mb-0.5 sm:mb-1 ${active ? 'text-sky-300/80' : 'text-white/20'}`}>{label}</p>
      <p className={`text-sm sm:text-lg md:text-2xl lg:text-3xl font-black tracking-tight ${active ? 'text-white' : 'text-white/30'}`}>{time}</p>
    </div>
  );
}

// --- Page: Home (Main Tracker) ---

function Home({
  data,
  loading,
  onRetry,
  errorMessage,
  cityName,
}) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const [currentStatus, setCurrentStatus] = useState("");
  const [todayData, setTodayData] = useState(null);
  const [timeProgress, setTimeProgress] = useState(0);
  const [shareStatus, setShareStatus] = useState("idle");

  useEffect(() => {
    if (!data) return;

    const updateCountdown = () => {
      const now = new Date();
      const todayStr = getTodayString();

      let currentIndex = data.fasting.findIndex(f => f.date === todayStr);
      if (currentIndex === -1) {
        currentIndex = data.fasting.findIndex(f => new Date(f.date) > now);
      }

      if (currentIndex === -1) return;

      const currentDay = data.fasting[currentIndex];
      const sahurTime = parseTime(currentDay.time.sahur, currentDay.date);
      const iftarTime = parseTime(currentDay.time.iftar, currentDay.date);

      let targetTime;
      let previousTime;
      let status = "";

      if (now < sahurTime) {
        targetTime = sahurTime;
        const previousDate = new Date(currentDay.date);
        previousDate.setDate(previousDate.getDate() - 1);
        previousTime = parseTime(currentDay.time.iftar, previousDate.toISOString().split("T")[0]);
        status = "sahur";
      } else if (now < iftarTime) {
        targetTime = iftarTime;
        previousTime = sahurTime;
        status = "iftar";
      } else {
        const tomorrowIndex = currentIndex + 1;
        if (tomorrowIndex < data.fasting.length) {
          const tomorrowDay = data.fasting[tomorrowIndex];
          targetTime = parseTime(tomorrowDay.time.sahur, tomorrowDay.date);
          previousTime = iftarTime;
          status = "sahur";
        }
      }

      setTodayData(currentDay);
      setCurrentStatus(status);

      if (targetTime) {
        let diff = targetTime.getTime() - now.getTime();
        if (diff < 0) diff = 0;

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        setTimeLeft({
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0")
        });

        if (previousTime && targetTime.getTime() > previousTime.getTime()) {
          const elapsed = now.getTime() - previousTime.getTime();
          const totalWindow = targetTime.getTime() - previousTime.getTime();
          const percent = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100));
          setTimeProgress(percent);
        } else {
          setTimeProgress(0);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  if (loading) return null;

  if (!data || !todayData) {
    return (
      <div className="relative z-10 w-full h-screen max-w-3xl px-6 py-8 flex items-center justify-center">
        <div className="glass-card w-full max-w-xl rounded-3xl border border-white/15 px-8 py-10 text-center shadow-2xl backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
            <AlertCircle size={22} />
          </div>
          <p className="text-base md:text-lg font-black tracking-wide text-white">Unable to load Ramadan timings</p>
          <p className="text-xs md:text-sm text-slate-300/90 mt-3 max-w-md mx-auto">
            {errorMessage || "Please check your internet connection and try again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleShareTimings = async () => {
    const text = `Ramadan ${data.ramadan_year} - ${todayData.date}\n${cityName || "Your Location"}\nSahur: ${formatTo12Hour(todayData.time.sahur)}\nIftar: ${formatTo12Hour(todayData.time.iftar)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ramadan ${data.ramadan_year} Timings`,
          text,
          url: window.location.href,
        });
        setShareStatus("shared");
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
      }
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch {
      setShareStatus("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 w-full h-screen max-h-screen max-w-5xl px-6 py-4 flex flex-col justify-between items-center overflow-y-auto overflow-x-hidden"
    >
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-2 shrink-0">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white flex flex-col md:flex-row gap-2">
            RAMADAN <span className="opacity-30 font-medium">{data.ramadan_year}</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 underline-offset-4">
            <span className="text-[10px] md:text-xs text-slate-400 font-bold tracking-[.3em] uppercase transition-colors hover:text-white cursor-default">
              {todayData.hijri_readable}
            </span>
            <div className="h-3 w-[1px] bg-white/10 hidden md:block" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[9px] md:text-xs font-bold text-slate-300">
              <MapPin size={10} className="text-sky-400" />
              {cityName || "Your Location"}
            </span>
          </div>
        </div>
        <Link to="/ramadan" className="group relative overflow-hidden bg-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 text-[10px] sm:text-xs font-black tracking-[.2em] text-white hover:bg-white/10 transition-all active:scale-95">
          <div className="relative z-10 inline-flex items-center gap-2">
            <CalendarDays size={14} className="text-sky-300 group-hover:rotate-12 transition-transform" />
            CALENDAR
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start md:justify-center w-full min-h-0 py-2 sm:py-4 gap-2">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full glass-card rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-3 sm:p-6 md:p-8 flex flex-col items-center border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-0"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-full max-w-lg mb-3 md:mb-5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Day Progress</span>
              <span className="text-xs font-black tabular-nums text-white/60">{Math.round(timeProgress)}%</span>
            </div>
            <div className="h-1.5 md:h-2 rounded-full bg-white/5 overflow-hidden p-[1px] border border-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-300 shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                animate={{ width: `${timeProgress}%` }}
                transition={{ duration: 1, ease: "circOut" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-5">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[10px] md:text-xs font-black tracking-[0.5em] uppercase text-sky-300/60 drop-shadow-sm">
              {currentStatus === "iftar" ? "Until Iftar" : "Until Sahur"}
            </span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-6 w-full mb-4 md:mb-6">
            <CountdownBlock value={timeLeft.h} label="Hrs" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.m} label="Min" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 w-full max-w-2xl px-1 sm:px-2 shrink-0">
            <TimingTile icon={<Clock />} label="SAHUR" time={formatTo12Hour(todayData.time.sahur)} active={currentStatus === "sahur"} />
            <TimingTile icon={<Sun />} label="IFTAR" time={formatTo12Hour(todayData.time.iftar)} active={currentStatus === "iftar"} />
          </div>

        </motion.div>
      </div>

      <FloatingActionMenu onShare={handleShareTimings} shareStatus={shareStatus} onRefresh={onRetry} ramadanYear={data?.ramadan_year} />
    </motion.div>
  );
}

// --- Page: Ramadan Calendar ---

// LocationPicker was removed and its logic integrated into FloatingActionMenu
function RamadanCalendar({
  data,
  loading,
  onRetry,
  errorMessage,
  cityName,
}) {
  const navigate = useNavigate();
  const todayRowRef = useRef(null);

  if (loading) return null;
  if (!data) {
    return (
      <div className="relative z-10 w-full h-screen max-w-3xl px-6 py-8 flex items-center justify-center">
        <div className="glass-card w-full max-w-xl rounded-3xl border border-white/15 px-8 py-10 text-center shadow-2xl backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
            <AlertCircle size={22} />
          </div>
          <p className="text-base md:text-lg font-black tracking-wide text-white">Calendar is unavailable</p>
          <p className="text-xs md:text-sm text-slate-300/90 mt-3 max-w-md mx-auto">
            {errorMessage || "Please try fetching timings again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="relative z-10 w-full h-screen max-h-screen max-w-5xl px-6 py-6 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-12 sticky top-0 z-20 py-4 backdrop-blur-3xl bg-black/40 border-b border-white/5 rounded-b-[2rem] px-4">
        <button aria-label="Go home" onClick={() => navigate("/")} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95 group">
          <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-white">Monthly <span className="text-sky-300">Schedule</span></h2>
          <p className="text-[10px] font-bold tracking-widest uppercase inline-flex items-center gap-1.5 mt-1 opacity-60">
            <MapPin size={10} className="text-sky-400" />
            {cityName || "Your Location"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Jump to today"
          onClick={() => todayRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-sky-400 group hover:text-black transition-all active:scale-95"
        >
          <Navigation size={14} className="group-hover:rotate-12 transition-transform" />
          Today
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {data.fasting.map((day, idx) => {
            const isToday = day.date === getTodayString();
            return (
              <motion.div
                key={idx}
                ref={isToday ? todayRowRef : null}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-6 md:p-8 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden ${isToday
                  ? 'border-sky-400/50 bg-sky-400/5 shadow-[0_20px_50px_-10px_rgba(56,189,248,0.1)]'
                  : 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-100 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]" />
                )}

                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${isToday ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/20 rotate-3' : 'bg-white/5 text-white/30 group-hover:bg-white/10'}`}>
                    <span className="text-[10px] uppercase font-black tracking-tighter opacity-70">{day.day.substring(0, 3)}</span>
                    <span className="text-xl font-black leading-none">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className={`text-lg font-black tracking-wide ${isToday ? 'text-white' : 'text-white/80'}`}>{day.hijri_readable.split(' AH')[0]}</p>
                      {isToday && <span className="text-[10px] bg-sky-400 text-black px-2 py-0.5 rounded-lg font-black tracking-widest uppercase">Today</span>}
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 mt-0.5`}>{day.date}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-10 md:gap-20">
                  <div className="text-center group/time">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-white/20 group-hover/time:text-sky-300 transition-colors">Sahur</p>
                    <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${isToday ? 'text-white' : 'text-white/50'}`}>{formatTo12Hour(day.time.sahur)}</p>
                  </div>
                  <div className="text-center group/time">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-white/20 group-hover/time:text-emerald-300 transition-colors">Iftar</p>
                    <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${isToday ? 'text-white' : 'text-white/50'}`}>{formatTo12Hour(day.time.iftar)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// --- Main App Entry ---

function AppContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cityName, setCityName] = useState("Your Location");
  const location = useLocation();
  const requestIdRef = useRef(0);

  const fetchRamadanData = async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError("");

      let coords = DEFAULT_COORDS;
      try {
        coords = await getBrowserCoords();
      } catch {
        coords = DEFAULT_COORDS;
      }

      resolveCityName(coords.lat, coords.lon).then((city) => {
        if (requestId === requestIdRef.current) setCityName(city);
      });
      const response = await fetch(`${API_URL}?lat=${coords.lat}&lon=${coords.lon}&api_key=${API_KEY}`);
      const json = await response.json();
      if (requestId !== requestIdRef.current) return;
      if (json.status === "success") {
        const nextData = { ramadan_year: json.ramadan_year, fasting: json.data?.fasting ?? [], resource: json.resource ?? null };
        const timestamp = Date.now();
        setData(nextData);
        writeScheduleCache(nextData, timestamp);
      } else {
        const cached = readScheduleCache();
        if (cached) {
          setData(cached.data);
          setError("Showing last saved schedule (API unavailable).");
        } else {
          setData(null);
          setError("Unable to fetch Ramadan schedule.");
        }
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const cached = readScheduleCache();
      if (cached) {
        setData(cached.data);
        setError("Offline mode: showing last saved schedule.");
      } else {
        setData(null);
        setError("Network error while loading schedule.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRamadanData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="h-12 w-12 rounded-full border-2 border-white/5 border-t-white" />
          <p className="text-[10px] tracking-[0.4em] uppercase opacity-40">Loading Schedule</p>
          <p className="text-[10px] text-white/30">Getting timings for your location...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-full overflow-hidden text-white bg-black flex flex-col items-center font-sans select-none">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url(/bg.avif)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
      </div>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Home
                data={data}
                loading={loading}
                onRetry={fetchRamadanData}
                errorMessage={error}
                cityName={cityName}
              />
            }
          />
          <Route
            path="/ramadan"
            element={
              <RamadanCalendar
                data={data}
                loading={loading}
                onRetry={fetchRamadanData}
                errorMessage={error}
                cityName={cityName}
              />
            }
          />
          <Route path="*" element={<Home data={data} loading={loading} onRetry={fetchRamadanData} errorMessage={error} cityName={cityName} />} />
        </Routes>
      </AnimatePresence>
      <div className="sr-only">App Mounted</div>
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-2 rounded-xl border border-white/20 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold tracking-wide flex items-center gap-2">
          <AlertCircle size={12} />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchRamadanData}
            className="ml-1 rounded-lg border border-white/15 px-2 py-1 text-[9px] uppercase tracking-wider hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      )}
    </main>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
