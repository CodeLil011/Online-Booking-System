// components/OpenStatusBadge.jsx
// Live "Open now" (green) / "Closed" (red) badge for the Visit Us section.
// It uses the time in the PHILIPPINES (Asia/Manila), so it is correct even if the
// visitor's computer is set to another time zone, and it updates itself every minute.

import { useEffect, useState } from "react";
import { OPEN_HOUR, CLOSE_HOUR } from "../config";

// Minutes since midnight right now in Manila, e.g. 2:30 PM -> 870
const getManilaMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23", // 0-23 hours
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour").value);
  const minute = Number(parts.find((part) => part.type === "minute").value);
  return hour * 60 + minute;
};

// 22 -> "10:00 PM"
const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;

function OpenStatusBadge() {
  const [minutesNow, setMinutesNow] = useState(getManilaMinutes);

  // Check the time again every minute, so the badge changes by itself at opening/closing time
  useEffect(() => {
    const timer = setInterval(() => setMinutesNow(getManilaMinutes()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = minutesNow >= OPEN_HOUR * 60 && minutesNow < CLOSE_HOUR * 60;

  return (
    <span className={isOpen ? "open-badge open" : "open-badge closed"}>
      {isOpen ? `Open now · closes ${formatHour(CLOSE_HOUR)}` : `Closed · opens ${formatHour(OPEN_HOUR)}`}
    </span>
  );
}

export default OpenStatusBadge;
