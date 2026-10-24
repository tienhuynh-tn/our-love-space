import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`min-w-0 max-w-full rounded-[1.75rem] border border-white/70 bg-white/78 shadow-[0_24px_80px_rgba(79,43,35,0.10)] shadow-stone-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/30 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
      {children}
    </p>
  );
}
