import { motion as Motion } from "framer-motion";
import { ChevronLeft, Calendar as CalendarIcon, Clock, Sunset, Sunrise } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../common/EmptyState";
import { getTodayString, formatTo12Hour } from "../../utils/time";

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
    <Motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="relative z-10 w-full h-full max-w-5xl px-4 md:px-6 py-8 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-10">
        <button 
          onClick={() => navigate("/")} 
          className="p-3.5 bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-hover)] border border-[var(--border-glass)] rounded-2xl transition-all shadow-xl group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">Monthly <span className="text-sky-500">Schedule</span></h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-dim)] mt-1">Ramadan {data.ramadan_year}</p>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-6">
        <table className="calendar-table min-w-[700px]">
          <thead>
            <tr>
              <th><div className="flex items-center gap-2"><CalendarIcon size={14} /> Day</div></th>
              <th>Hijri Date</th>
              <th>Gregorian Date</th>
              <th><div className="flex items-center gap-2"><Sunrise size={14} className="text-amber-400" /> Sahur</div></th>
              <th><div className="flex items-center gap-2"><Sunset size={14} className="text-sky-400" /> Iftar</div></th>
            </tr>
          </thead>
          <tbody>
            {data.fasting.map((day, idx) => {
              const isToday = day.date === today;
              return (
                <tr key={day.date ?? idx} className={isToday ? "is-today" : ""}>
                    <td>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isToday ? 'bg-sky-500 text-white' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                                {idx + 1}
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-wide ${isToday ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                {day.day.substring(0, 3)}
                            </span>
                            {isToday && (
                                <span className="text-[8px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-black tracking-tighter uppercase">Today</span>
                            )}
                        </div>
                    </td>
                    <td>
                        <span className="text-sm font-semibold tracking-tight">
                            {day.hijri_readable.split(" AH")[0]}
                        </span>
                    </td>
                    <td>
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] whitespace-nowrap">
                            {day.date}
                        </span>
                    </td>
                    <td>
                        <div className="flex flex-col">
                            <span className={`text-lg font-black tracking-tight ${isToday ? 'text-sky-400' : 'text-[var(--text-main)]'}`}>
                                {formatTo12Hour(day.time.sahur)}
                            </span>
                        </div>
                    </td>
                    <td>
                        <div className="flex flex-col">
                            <span className={`text-lg font-black tracking-tight ${isToday ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
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
    </Motion.div>
  );
}

export default RamadanCalendar;

