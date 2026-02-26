function TimingTile({ icon, label, time, active }) {
  return (
    <div
      className={`p-4 md:p-6 rounded-3xl border flex flex-col items-center justify-center text-center transition-all duration-500 ${
        active
          ? "bg-white/10 border-white/20 scale-105 shadow-2xl"
          : "bg-white/5 border-transparent opacity-40"
      }`}
    >
      <div className={`p-2 rounded-xl mb-2 ${active ? "bg-white text-slate-950" : "bg-white/5 text-white/40"}`}>{icon}</div>
      <p className={`text-[8px] md:text-[10px] font-black tracking-widest uppercase mb-1 ${active ? "text-white/60" : "text-white/20"}`}>
        {label}
      </p>
      <p className={`text-xl md:text-3xl font-black ${active ? "text-white" : "text-white/40"}`}>{time}</p>
    </div>
  );
}

export default TimingTile;
