import { motion as Motion } from "framer-motion";
import { Moon } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.2),transparent_40%)]" />
      <div className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl px-10 py-9 shadow-2xl shadow-slate-950/80">
        <div className="relative h-20 w-20 flex items-center justify-center">
          <Motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-amber-400/40 border-t-amber-400"
          />
          <Motion.div
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

export default LoadingScreen;
