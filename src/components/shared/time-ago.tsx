
"use client";

import { useSyncExternalStore } from "react";

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
  const seconds = Math.round(
    (new Date(iso).getTime() - Date.now()) / 1000
  );

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }

  return "just now";
}

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function TimeAgo({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const text = mounted
    ? relative(date)
    : fixedFormat.format(new Date(date));

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
