import { getTodayString, parseTime } from "./time";

const EMPTY_TIME = { h: "00", m: "00", s: "00" };

function toTimeLeft(diffMs) {
  const safe = Math.max(0, diffMs);
  const h = Math.floor(safe / 3600000);
  const m = Math.floor((safe / 60000) % 60);
  const s = Math.floor((safe / 1000) % 60);
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export function getCountdownSnapshot(ramadanData, now = new Date()) {
  const fasting = ramadanData?.fasting;
  if (!Array.isArray(fasting) || fasting.length === 0) {
    return {
      todayData: null,
      currentStatus: "",
      timeProgress: 0,
      timeLeft: EMPTY_TIME,
    };
  }

  const today = getTodayString();
  let currentIndex = fasting.findIndex((row) => row.date === today);
  if (currentIndex === -1) {
    currentIndex = fasting.findIndex((row) => new Date(row.date) > now);
  }
  if (currentIndex === -1) {
    const last = fasting[fasting.length - 1];
    return {
      todayData: last,
      currentStatus: "",
      timeProgress: 100,
      timeLeft: EMPTY_TIME,
    };
  }

  const currentDay = fasting[currentIndex];
  const sahurTime = parseTime(currentDay?.time?.sahur, currentDay.date);
  const iftarTime = parseTime(currentDay?.time?.iftar, currentDay.date);

  if (!sahurTime || !iftarTime) {
    return {
      todayData: currentDay,
      currentStatus: "",
      timeProgress: 0,
      timeLeft: EMPTY_TIME,
    };
  }

  let currentStatus = "";
  let targetTime = null;
  let previousTime = null;

  if (now < sahurTime) {
    currentStatus = "sahur";
    targetTime = sahurTime;
    const previousDate = new Date(currentDay.date);
    previousDate.setDate(previousDate.getDate() - 1);
    previousTime = parseTime(currentDay.time.iftar, previousDate.toISOString().split("T")[0]);
  } else if (now < iftarTime) {
    currentStatus = "iftar";
    targetTime = iftarTime;
    previousTime = sahurTime;
  } else {
    const tomorrowIndex = currentIndex + 1;
    if (tomorrowIndex < fasting.length) {
      const tomorrowDay = fasting[tomorrowIndex];
      currentStatus = "sahur";
      targetTime = parseTime(tomorrowDay?.time?.sahur, tomorrowDay.date);
      previousTime = iftarTime;
    }
  }

  const timeLeft = targetTime ? toTimeLeft(targetTime.getTime() - now.getTime()) : EMPTY_TIME;

  let timeProgress = 0;
  if (targetTime && previousTime && targetTime.getTime() > previousTime.getTime()) {
    const elapsed = now.getTime() - previousTime.getTime();
    const totalWindow = targetTime.getTime() - previousTime.getTime();
    timeProgress = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100));
  }

  return {
    todayData: currentDay,
    currentStatus,
    timeProgress,
    timeLeft,
  };
}
