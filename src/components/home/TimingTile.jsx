function TimingTile({ icon, label, time, active }) {
  return (
    <div className={`group p-5 md:p-8 rounded-[2rem] border transition-all duration-700 relative overflow-hidden ${active ? 'bg-white/10 border-white/20 scale-[1.03] shadow-[0_20px_40px_-15px_rgba(125,211,252,0.15)] ring-1 ring-white/10' : 'bg-white/5 border-transparent opacity-40 hover:opacity-80 hover:bg-white/8'}`}>
      {active && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 to-transparent pointer-none" />
      )}
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-4 mx-auto transition-transform group-hover:scale-110 duration-500 ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/30'}`}>
        {icon}
      </div>
      <p className={`text-[9px] md:text-[11px] font-black tracking-[.25em] uppercase mb-2 ${active ? 'text-sky-300/80' : 'text-white/20'}`}>{label}</p>
      <p className={`text-2xl md:text-4xl font-black tracking-tight ${active ? 'text-white' : 'text-white/30'}`}>{time}</p>
    </div>
  );
}

export default TimingTile;
