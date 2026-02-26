import { formatTo12Hour } from "../../utils/time";

function CalendarRow({ day, index, isToday }) {
  return (
    <div
      className={`flex items-center justify-between p-5 rounded-3xl glass-card transition-all duration-500 relative overflow-hidden ${
        isToday
          ? "border-white/30 bg-white/10 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] scale-[1.01]"
          : "border-white/5 opacity-60 hover:opacity-100"
      }`}
    >
      {isToday ? <div className="absolute top-0 left-0 w-1 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" /> : null}

      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-colors ${
            isToday ? "bg-white text-slate-950" : "bg-white/5 text-white/40"
          }`}
        >
          <span className="text-[10px] uppercase font-bold">{day.day.substring(0, 3)}</span>
          <span className="text-lg font-black leading-none">{index + 1}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black tracking-wide text-white">{day.hijri_readable.split(" AH")[0]}</p>
            {isToday ? (
              <span className="text-[8px] bg-white text-slate-950 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">Today</span>
            ) : null}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{day.date}</p>
        </div>
      </div>

      <div className="flex gap-6 md:gap-16">
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-20">Sahur</p>
          <p className={`text-md md:text-xl font-black ${isToday ? "text-white" : "text-white/40"}`}>{formatTo12Hour(day.time.sahur)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-20">Iftar</p>
          <p className={`text-md md:text-xl font-black ${isToday ? "text-white" : "text-white/40"}`}>{formatTo12Hour(day.time.iftar)}</p>
        </div>
      </div>
    </div>
  );
}

export default CalendarRow;
