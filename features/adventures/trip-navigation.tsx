"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TripNavigation({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  return <nav aria-label="Trip sections" className="grid grid-cols-4 gap-1 border-t border-stone-500/15 p-2">
    {[["Overview",""],["Itinerary","/itinerary"],["Expenses","/expenses"],["Memories","/memories"]].map(([label,path]) => {
      const href = `/adventures/${tripId}${path}`;
      const active = pathname === href || (!path && pathname.endsWith("/edit"));
      return <Link aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center justify-center rounded-xl text-xs font-semibold sm:text-sm ${active ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950" : "hover:bg-stone-500/10"}`} href={href} key={label}>{label}</Link>;
    })}
  </nav>;
}
