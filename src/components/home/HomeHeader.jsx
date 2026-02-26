import { Link } from "react-router-dom";

function HomeHeader({ ramadanYear, hijriDate }) {
  return (
    <div className="w-full flex justify-between items-start">
      <div>
        <h1 className="text-xl md:text-4xl font-black tracking-tight uppercase leading-none text-white">
          RAMADAN <span className="opacity-40">{ramadanYear}</span>
        </h1>
        <div className="flex items-center gap-2 mt-1 text-[8px] md:text-[10px] text-white/40 font-bold tracking-widest uppercase">
          <span>{hijriDate}</span>
        </div>
      </div>
      <Link
        to="/ramadan"
        className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-bold tracking-wider text-white hover:bg-white/10 transition-all"
      >
        CALENDAR
      </Link>
    </div>
  );
}

export default HomeHeader;
