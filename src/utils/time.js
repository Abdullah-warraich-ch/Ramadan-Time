export function parseTime(timeStr, dateStr) {
  if (!timeStr) return null;

  const normalized = timeStr.trim().toUpperCase();
  const [rawTime, modifier] = normalized.split(/\s+/);
  const [rawHours, rawMinutes] = rawTime.split(":").map(Number);

  if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return null;

  let hours = rawHours;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const date = new Date(dateStr);
  date.setHours(hours, rawMinutes, 0, 0);
  return date;
}

export function formatTo12Hour(timeStr) {
  if (!timeStr) return "--:--";

  const normalized = timeStr.trim().toUpperCase();
  const [rawTime, modifier] = normalized.split(/\s+/);
  const [rawHours, rawMinutes] = rawTime.split(":").map(Number);

  if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return timeStr;

  let hours24 = rawHours;
  if (modifier === "PM" && hours24 < 12) hours24 += 12;
  if (modifier === "AM" && hours24 === 12) hours24 = 0;

  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const minutes = rawMinutes.toString().padStart(2, "0");

  return `${hours12}:${minutes} ${suffix}`;
}

export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}
