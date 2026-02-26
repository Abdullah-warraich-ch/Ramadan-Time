import { useEffect, useState } from "react";
import { parseTime, getTodayString } from "../utils/time";

const INITIAL_TIME = { h: "00", m: "00", s: "00" };

export function useCountdown(data) {
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [currentStatus, setCurrentStatus] = useState("");
  const [todayData, setTodayData] = useState(null);

  useEffect(() => {
    if (!data?.fasting?.length) {
      setTodayData(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const todayStr = getTodayString();

      let currentIndex = data.fasting.findIndex((item) => item.date === todayStr);
      if (currentIndex === -1) {
        currentIndex = data.fasting.findIndex((item) => new Date(item.date) > now);
      }

      if (currentIndex === -1) return;

      const currentDay = data.fasting[currentIndex];
      const sahurTime = parseTime(currentDay.time.sahur, currentDay.date);
      const iftarTime = parseTime(currentDay.time.iftar, currentDay.date);

      let targetTime;
      let status = "";

      if (now < sahurTime) {
        targetTime = sahurTime;
        status = "sahur";
      } else if (now < iftarTime) {
        targetTime = iftarTime;
        status = "iftar";
      } else {
        const tomorrowIndex = currentIndex + 1;
        if (tomorrowIndex < data.fasting.length) {
          const tomorrowDay = data.fasting[tomorrowIndex];
          targetTime = parseTime(tomorrowDay.time.sahur, tomorrowDay.date);
          status = "sahur";
        }
      }

      setTodayData(currentDay);
      setCurrentStatus(status);

      if (targetTime) {
        let diff = targetTime.getTime() - now.getTime();
        if (diff < 0) diff = 0;

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        setTimeLeft({
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  return { timeLeft, currentStatus, todayData };
}
