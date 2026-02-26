import { motion } from "framer-motion";
import EmptyState from "../common/EmptyState";
import { useCountdown } from "../../hooks/useCountdown";
import { formatTo12Hour } from "../../utils/time";
import HomeHeader from "./HomeHeader";
import CountdownPanel from "./CountdownPanel";
import HomeFooter from "./HomeFooter";

function Home({ data, loading }) {
  const { timeLeft, currentStatus, todayData } = useCountdown(data);

  if (loading) return null;

  if (!data || !todayData) {
    return (
      <EmptyState
        title="Unable to load Ramadan timings"
        description="Please check your internet connection and try again."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 w-full h-full max-w-5xl px-6 py-4 flex flex-col justify-between items-center"
    >
      <HomeHeader ramadanYear={data.ramadan_year} hijriDate={todayData.hijri_readable} />

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <CountdownPanel
          timeLeft={timeLeft}
          currentStatus={currentStatus}
          sahurTime={formatTo12Hour(todayData.time.sahur)}
          iftarTime={formatTo12Hour(todayData.time.iftar)}
        />
      </div>

      <HomeFooter hadithText={data?.resource?.hadith?.english} />
    </motion.div>
  );
}

export default Home;
