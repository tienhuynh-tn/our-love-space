"use client";

import { useState } from "react";

type ThinkingButtonProps = {
  partnerName: string;
  recentThinkingAt: string;
};

export function ThinkingButton({ partnerName, recentThinkingAt }: ThinkingButtonProps) {
  const [sentAt, setSentAt] = useState<string | null>(null);

  const label = sentAt ? "Sent just now" : `Send to ${partnerName}`;
  const detail = sentAt
    ? `${partnerName} will see that you were thinking of them.`
    : `Last signal was ${formatRecentTime(recentThinkingAt)}.`;

  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-stone-950 p-4 text-white shadow-[0_20px_50px_rgba(28,25,23,0.22)] dark:border-white/10 dark:bg-white dark:text-stone-950">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-65">Thinking of you</p>
      <button
        type="button"
        onClick={() => setSentAt(new Date().toISOString())}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-stone-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f7efe7] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-stone-950 active:translate-y-0 dark:bg-stone-950 dark:text-white dark:hover:bg-stone-800 dark:focus:ring-stone-950 dark:focus:ring-offset-white"
      >
        {label}
      </button>
      <p className="mt-3 text-sm leading-6 opacity-72">{detail}</p>
    </div>
  );
}

function formatRecentTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
