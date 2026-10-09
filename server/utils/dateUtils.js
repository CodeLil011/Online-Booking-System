// utils/dateUtils.js
// Helper functions for dates and times.
//
// Dates are stored as "YYYY-MM-DD" text and times as "HH:MM" text.
// This format compares correctly as plain text ("2026-10-09" < "2026-10-10")
// and avoids timezone problems.

// Adds a leading zero: 5 -> "05"
const pad = (number) => String(number).padStart(2, "0");

// Converts a JavaScript Date object to "YYYY-MM-DD" (server's local time)
const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Today's date as "YYYY-MM-DD"
const getToday = () => toDateString(new Date());

const addDays = (dateString, days) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return toDateString(new Date(year, month - 1, day + days));
};

// Current time as "HH:MM"
const getCurrentTime = () => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

// true for real dates like "2026-10-10"
// false for wrong formats ("10/10/2026") or impossible dates ("2026-02-30")
const isValidDateString = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // JavaScript turns "2026-02-30" into March 2, so we check it did not change
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

module.exports = { getToday, addDays, getCurrentTime, isValidDateString };
