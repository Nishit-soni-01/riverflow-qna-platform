"use client";

import { useEffect, useState } from "react";

// Fixed locale + timezone so server and client render the same first string.
const fixedFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relative(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

/**
 * Shows a fixed date first, then switches to "3 hours ago" after mount.
 * Date.now() only runs inside an effect, which Next.js 16 Cache Components allows.
 */
export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const [text, setText] = useState(() => fixedFormat.format(new Date(date)));

  useEffect(() => {
    setText(relative(date));
  }, [date]);

  return (
    <time
      dateTime={date}
      title={fixedFormat.format(new Date(date))}
      className={className}
    >
      {text}
    </time>
  );
}
