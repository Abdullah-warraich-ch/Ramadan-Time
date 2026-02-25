import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  MapPin,
  Calendar,
  Timer,
  ChevronRight,
  Clock,
  LayoutDashboard,
  ExternalLink,
  ChevronLeft
} from "lucide-react";

// --- Utility Functions ---

function parseTime(timeStr, dateStr) {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(/\s+/);
  const time = parts[0];
  const modifier = parts[1];
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// --- Components ---

function CountdownBlock({ value, label, highlight }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-6xl md:text-9xl font-black tabular-nums tracking-tighter leading-none ${highlight ? 'text-sky-300' : 'text-white'}`}>
        {value}
      </div>
      <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold text-slate-400 mt-2 md:mt-4">{label}</span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-4xl md:text-6xl font-thin text-white/5 mt-[-1rem] md:mt-[-2rem]">:</div>
  );
}

function TimingTile({ icon, label, time, active }) {
  return (
    <div className={`p-4 md:p-6 rounded-3xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${active ? 'bg-white/10 border-white/20 scale-105 shadow-2xl' : 'bg-white/5 border-transparent opacity-40'}`}>
      <div className={`p-2 rounded-xl mb-2 ${active ? 'bg-white text-slate-950' : 'bg-white/5 text-white/40'}`}>
        {icon}
      </div>
      <p className={`text-[8px] md:text-[10px] font-black tracking-widest uppercase mb-1 ${active ? 'text-white/60' : 'text-white/20'}`}>{label}</p>
      <p className={`text-xl md:text-3xl font-black ${active ? 'text-white' : 'text-white/40'}`}>{time}</p>
    </div>
  );
}

// --- Page: Home (Main Tracker) ---

function Home({ data, loading }) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const [currentStatus, setCurrentStatus] = useState("");
  const [todayData, setTodayData] = useState(null);

  useEffect(() => {
    if (!data) return;

    const updateCountdown = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let currentIndex = data.fasting.findIndex(f => f.date === todayStr);
      if (currentIndex === -1) {
        currentIndex = data.fasting.findIndex(f => new Date(f.date) > now);
      }

      if (currentIndex === -1) return;

      const currentDay = data.fasting[currentIndex];
      const sahurTime = parseTime(currentDay.time.sahur, currentDay.date);
      const iftarTime = parseTime(currentDay.time.iftar, currentDay.date);

      let targetTime;
      let status = "";

      if (now < sahurTime) {
        targetTime = sahurTime;
        status = "sahur";
      } else if (now < iftarTime) {
        targetTime = iftarTime;
        status = "iftar";
      } else {
        const tomorrowIndex = currentIndex + 1;
        if (tomorrowIndex < data.fasting.length) {
          const tomorrowDay = data.fasting[tomorrowIndex];
          targetTime = parseTime(tomorrowDay.time.sahur, tomorrowDay.date);
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
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  if (loading) return null;

  if (!data || !todayData) {
    return (
      <div className="relative z-10 w-full h-full max-w-3xl px-6 py-8 flex items-center justify-center">
        <div className="glass-card rounded-3xl border-white/10 px-6 py-8 text-center">
          <p className="text-sm md:text-base font-semibold text-white">Unable to load Ramadan timings.</p>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Please check your internet connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 w-full h-full max-w-5xl px-6 py-4 flex flex-col justify-between items-center"
    >
      <div className="w-full flex justify-between items-start">
        <div>
          <h1 className="text-xl md:text-4xl font-black tracking-tight uppercase leading-none text-white">
            RAMADAN <span className="opacity-40">{data.ramadan_year}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[8px] md:text-[10px] text-white/40 font-bold tracking-widest uppercase">
            <span>{todayData.hijri_readable}</span>
          </div>
        </div>
        <Link to="/ramadan" className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-bold tracking-wider text-white hover:bg-white/10 transition-all">
          CALENDAR
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="w-full glass-card rounded-[3rem] p-6 md:p-12 flex flex-col items-center border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs md:text-sm font-medium tracking-[0.5em] uppercase text-white/40">
              {currentStatus === "iftar" ? "Until Iftar" : "Until Sahur"}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 md:gap-10 w-full mb-10">
            <CountdownBlock value={timeLeft.h} label="Hrs" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.m} label="Min" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8 w-full max-w-2xl">
            <TimingTile icon={<Clock size={20} />} label="SAHUR" time={todayData.time.sahur} active={currentStatus === "sahur"} />
            <TimingTile icon={<Sun size={20} />} label="IFTAR" time={todayData.time.iftar} active={currentStatus === "iftar"} />
          </div>
        </motion.div>
      </div>

      <footer className="w-full text-center px-4 pb-4">
        <p className="text-white/20 italic text-[10px] md:text-xs font-light leading-snug max-w-sm mx-auto">
          "{data?.resource?.hadith?.english ?? "May your fast be accepted."}"
        </p>
      </footer>
    </motion.div>
  );
}

// --- Page: Ramadan Calendar ---

function RamadanCalendar({ data, loading }) {
  const navigate = useNavigate();

  if (loading) return null;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="relative z-10 w-full h-full max-w-5xl px-6 py-6 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={() => navigate("/")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black tracking-widest uppercase">Monthly Schedule</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {data.fasting.map((day, idx) => {
            const isToday = day.date === new Date().toISOString().split('T')[0];
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-5 rounded-3xl glass-card transition-all duration-500 relative overflow-hidden ${isToday
                    ? 'border-white/30 bg-white/10 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] scale-[1.01]'
                    : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                )}

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-colors ${isToday ? 'bg-white text-slate-950' : 'bg-white/5 text-white/40'}`}>
                    <span className="text-[10px] uppercase font-bold">{day.day.substring(0, 3)}</span>
                    <span className="text-lg font-black leading-none">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black tracking-wide text-white`}>{day.hijri_readable.split(' AH')[0]}</p>
                      {isToday && <span className="text-[8px] bg-white text-slate-950 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">Today</span>}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-white/20`}>{day.date}</p>
                  </div>
                </div>

                <div className="flex gap-6 md:gap-16">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-20">Sahur</p>
                    <p className={`text-md md:text-xl font-black ${isToday ? 'text-white' : 'text-white/40'}`}>{day.time.sahur}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-20">Iftar</p>
                    <p className={`text-md md:text-xl font-black ${isToday ? 'text-white' : 'text-white/40'}`}>{day.time.iftar}</p>
                  </div>
                </div>
              </div>
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
  const location = useLocation();
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    async function fetchRamadanData() {
      try {
        setLoading(true);
        setError("");
        let lat = 24.8607;
        let lon = 67.0011;
        const coords = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve({ lat, lon }); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat, lon }),
            { timeout: 5000 }
          );
        });
        const response = await fetch(`https://islamicapi.com/api/v1/ramadan/?lat=${coords.lat}&lon=${coords.lon}&api_key=xZaaeSeRVvFTVjojf6KQOBYT7aihHJAAnu3zdHQVTNTvjQR3`);
        const json = await response.json();
        if (requestId !== requestIdRef.current) return;
        if (json.status === "success") {
          setData({ ramadan_year: json.ramadan_year, fasting: json.data?.fasting ?? [], resource: json.resource ?? null });
        } else {
          setError("Unable to fetch Ramadan schedule.");
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError("Network error while loading schedule.");
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }
    fetchRamadanData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="h-12 w-12 rounded-full border-2 border-white/5 border-t-white" />
          <p className="text-[10px] tracking-[0.4em] uppercase opacity-40">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden text-white bg-black flex flex-col items-center font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url(/bg.avif)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
      </div>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home data={data} loading={loading} />} />
          <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} />} />
        </Routes>
      </AnimatePresence>
      {error && !data && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-bold tracking-widest">{error}</div>}
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
