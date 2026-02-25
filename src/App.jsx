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

  // Use the provided date string to ensure we are on the right day
  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// --- Components ---

function CountdownBlock({ value, label, highlight }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-6xl md:text-9xl font-black tabular-nums tracking-tighter leading-none ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
      <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold text-slate-500 mt-2 md:mt-4">{label}</span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-4xl md:text-6xl font-thin text-slate-800 mt-[-1rem] md:mt-[-2rem]">:</div>
  );
}

function TimingTile({ icon, label, time, active }) {
  return (
    <div className={`p-4 md:p-6 rounded-3xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${active ? 'bg-amber-400 border-transparent scale-105 shadow-xl shadow-amber-500/10' : 'bg-white/5 border-white/10 opacity-60'}`}>
      <div className={`p-2 rounded-xl mb-2 ${active ? 'bg-slate-950 text-amber-400' : 'bg-amber-400/10 text-amber-400'}`}>
        {icon}
      </div>
      <p className={`text-[8px] md:text-[10px] font-black tracking-widest uppercase mb-1 ${active ? 'text-slate-900/60' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-xl md:text-3xl font-black ${active ? 'text-slate-950' : 'text-white'}`}>{time}</p>
    </div>
  );
}

// --- Page: Home (Main Tracker) ---

function Home({ data, loading }) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const [currentStatus, setCurrentStatus] = useState(""); // sahur or iftar
  const [todayData, setTodayData] = useState(null);

  useEffect(() => {
    if (!data) return;

    const updateCountdown = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Find today's data index
      let currentIndex = data.fasting.findIndex(f => f.date === todayStr);
      if (currentIndex === -1) {
        // If today is not in range, find the first day after today
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
        // After Iftar, look for tomorrow's Sahur
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 w-full h-full max-w-5xl px-6 py-3 flex flex-col justify-between items-center"
    >
      {/* Header */}
      <div className="w-full flex justify-between items-start">
        <div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight uppercase leading-none">
            RAMADAN <span className="text-amber-400">{data.ramadan_year}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[8px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            <Calendar size={10} className="text-amber-400/50" />
            <span>{todayData.hijri_readable}</span>
          </div>
        </div>
        <Link to="/ramadan" className="group bg-white/5 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
          <LayoutDashboard size={14} className="text-amber-400" />
          <span className="text-[10px] font-bold tracking-wider text-slate-300">CALENDAR</span>
        </Link>
      </div>

      {/* Main Countdown */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-h-[75%]">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-full glass-card rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${currentStatus === 'iftar' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-300'}`}>
              {currentStatus === "iftar" ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className="text-xs md:text-sm font-medium tracking-[0.4em] uppercase text-slate-400">
              {currentStatus === "iftar" ? "Time Until Iftar" : "Time Until Sahur"}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 md:gap-8 w-full mb-6">
            <CountdownBlock value={timeLeft.h} label="Hrs" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.m} label="Min" />
            <CountdownSeparator />
            <CountdownBlock value={timeLeft.s} label="Sec" highlight={currentStatus === "iftar"} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-xl">
            <TimingTile
              icon={<Clock size={16} />}
              label="SAHUR"
              time={todayData.time.sahur}
              active={currentStatus === "sahur"}
            />
            <TimingTile
              icon={<Sun size={16} />}
              label="IFTAR"
              time={todayData.time.iftar}
              active={currentStatus === "iftar"}
            />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center px-4 pb-2">
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-500 italic text-[10px] md:text-xs font-light leading-tight max-w-sm">
            "{data?.resource?.hadith?.english ?? "May your fast be accepted."}"
          </p>
          <div className="text-[7px] font-black tracking-[0.4em] text-slate-700 uppercase">
            {data?.resource?.hadith?.source ?? "RAMADAN TRACKER"}
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// --- Page: Ramadan Calendar ---

function RamadanCalendar({ data, loading }) {
  const navigate = useNavigate();

  if (loading) return null;

  if (!data) {
    return (
      <div className="relative z-10 w-full h-full max-w-3xl px-6 py-8 flex items-center justify-center">
        <div className="glass-card rounded-3xl border-white/10 px-6 py-8 text-center">
          <p className="text-sm md:text-base font-semibold text-white">Calendar is unavailable right now.</p>
          <p className="text-xs md:text-sm text-slate-400 mt-2">Please return to home and try again.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold tracking-wide uppercase"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative z-10 w-full h-full max-w-5xl px-6 py-4 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-widest uppercase text-amber-400">Monthly Schedule</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-2">
          {data.fasting.map((day, idx) => {
            const isToday = day.date === new Date().toISOString().split('T')[0];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`flex items-center justify-between p-4 rounded-2xl glass-card border-white/5 ${isToday ? 'border-amber-400/50 bg-amber-400/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/5 text-slate-400'}`}>
                    <span className="text-[10px] leading-none uppercase">{day.day.substring(0, 3)}</span>
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">{day.hijri_readable.split(' AH')[0]}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{day.date}</p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-12">
                  <div className="text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Sahur</p>
                    <p className="text-sm md:text-md font-black text-blue-300">{day.time.sahur}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Iftar</p>
                    <p className="text-sm md:text-md font-black text-amber-400">{day.time.iftar}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="w-full pt-4 flex justify-center gap-4">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-2 h-2 rounded-full bg-blue-400/40" />
          <span>SAHUR</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-2 h-2 rounded-full bg-amber-400/40" />
          <span>IFTAR</span>
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
        // Default coordinates
        let lat = 24.8607;
        let lon = 67.0011;

        const getCoords = () => new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({ lat, lon });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat, lon }),
            { timeout: 5000 }
          );
        });

        const coords = await getCoords();
        const response = await fetch(
          `https://islamicapi.com/api/v1/ramadan/?lat=${coords.lat}&lon=${coords.lon}&api_key=xZaaeSeRVvFTVjojf6KQOBYT7aihHJAAnu3zdHQVTNTvjQR3`
        );

        const json = await response.json();
        if (requestId !== requestIdRef.current) return;

        if (json.status === "success") {
          setData({
            ramadan_year: json.ramadan_year,
            fasting: json.data?.fasting ?? [],
            resource: json.resource ?? null,
          });
          setError("");
        } else {
          setData(null);
          setError("Unable to fetch Ramadan schedule.");
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error(err);
        setData(null);
        setError("Network error while loading schedule.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchRamadanData();
  }, []);

  if (loading) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-[#020617] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.2),transparent_40%)]" />
        <div className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl px-10 py-9 shadow-2xl shadow-slate-950/80">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-amber-400/40 border-t-amber-400"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-blue-300/40 border-b-blue-300"
            />
            <Moon size={24} className="text-amber-300" />
          </div>
          <div className="text-center">
            <p className="text-[11px] tracking-[0.35em] uppercase text-slate-300">Loading Timings</p>
            <p className="mt-2 text-xs text-slate-500">Detecting location and preparing today&apos;s schedule</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden text-white bg-[#020617] flex flex-col items-center font-sans">
      {/* Background - Fixed to bg.avif as requested */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 grayscale-[30%]"
          style={{ backgroundImage: "url(/bg.avif)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950" />
      </div>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home data={data} loading={loading} />} />
          <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} />} />
        </Routes>
      </AnimatePresence>

      {error && !data && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl border border-amber-400/30 bg-slate-950/80 text-[11px] md:text-xs text-amber-300 tracking-wide">
          {error}
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
