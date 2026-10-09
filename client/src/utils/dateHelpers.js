// utils/dateHelpers.js
// Date/time helpers for the website.
// Dates are "YYYY-MM-DD" text and times are "HH:MM" text (same as the backend).

const pad = (number) => String(number).padStart(2, "0");

// Date object -> "2026-10-15" (local time)
export const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Today as "YYYY-MM-DD"
export const getTodayString = () => toDateString(new Date());

// Today + N days as "YYYY-MM-DD"
export const addDaysString = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

// "19:00" -> "7:00 PM"
export const formatTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad(minutes)} ${suffix}`;
};

// "2026-10-15" -> "Thursday, October 15, 2026"
export const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getNowString = () => {
  const now = new Date();
  return `${toDateString(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
