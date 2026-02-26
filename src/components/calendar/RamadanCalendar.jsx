import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import CalendarRow from "./CalendarRow";
import { getTodayString } from "../../utils/time";

function RamadanCalendar({ data, loading }) {
  const navigate = useNavigate();

  if (loading) return null;

  if (!data) {
    return (
      <EmptyState title="Calendar is unavailable right now." description="Please return to home and try again.">
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold tracking-wide uppercase"
        >
          Go Home
        </button>
      </EmptyState>
    );
  }

  const today = getTodayString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
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
          {data.fasting.map((day, idx) => (
            <CalendarRow key={day.date ?? idx} day={day} index={idx} isToday={day.date === today} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default RamadanCalendar;
