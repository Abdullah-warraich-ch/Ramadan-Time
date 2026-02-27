import { motion as Motion } from "framer-motion";
import { Clock, Sun } from "lucide-react";
import CountdownBlock from "./CountdownBlock";
import CountdownSeparator from "./CountdownSeparator";
import TimingTile from "./TimingTile";

function CountdownPanel({ timeLeft, currentStatus, sahurTime, iftarTime }) {
  return (
    <Motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
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
        <TimingTile icon={<Clock size={20} />} label="SAHUR" time={sahurTime} active={currentStatus === "sahur"} />
        <TimingTile icon={<Sun size={20} />} label="IFTAR" time={iftarTime} active={currentStatus === "iftar"} />
      </div>
    </Motion.div>
  );
}

export default CountdownPanel;
