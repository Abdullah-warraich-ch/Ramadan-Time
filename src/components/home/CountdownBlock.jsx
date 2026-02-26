function CountdownBlock({ value, label, highlight }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-6xl md:text-9xl font-black tabular-nums tracking-tighter leading-none ${
          highlight ? "text-sky-300" : "text-white"
        }`}
      >
        {value}
      </div>
      <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold text-slate-400 mt-2 md:mt-4">
        {label}
      </span>
    </div>
  );
}

export default CountdownBlock;
