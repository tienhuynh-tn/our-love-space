"use client";

import { useEffect, useMemo, useState } from "react";

type LocalTimeProps = {
  timezone: string;
};

export function LocalTime({ timezone }: LocalTimeProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = useMemo(() => {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(now);
  }, [now, timezone]);

  return <time suppressHydrationWarning>{formatted}</time>;
}

type CountdownProps = {
  startsAt: string;
  label?: string;
  arrivedLabel?: string;
};

export function MeetingCountdown({ startsAt }: CountdownProps) {
  return <Countdown startsAt={startsAt} label="Countdown to next meeting" />;
}

export function Countdown({ startsAt, label = "Countdown to departure", arrivedLabel }: CountdownProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = useMemo(() => {
    const start = new Date(startsAt).getTime();
    const current = now.getTime();
    const remaining = Math.max(0, start - current);
    const totalMinutes = Math.floor(remaining / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes, arrived: remaining === 0 };
  }, [now, startsAt]);

  if (parts.arrived && arrivedLabel) return <p className="text-sm font-medium" suppressHydrationWarning>{arrivedLabel}</p>;
  return (
    <div className="grid grid-cols-3 gap-2" aria-label={label}>
      <CountdownPart label="days" value={parts.days} />
      <CountdownPart label="hours" value={parts.hours} />
      <CountdownPart label="mins" value={parts.minutes} />
    </div>
  );
}

function CountdownPart({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-3 text-center shadow-sm dark:bg-white/[0.08]">
      <p
        className="text-2xl font-semibold tabular-nums tracking-tight text-stone-950 dark:text-white"
        suppressHydrationWarning
      >
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
    </div>
  );
}
