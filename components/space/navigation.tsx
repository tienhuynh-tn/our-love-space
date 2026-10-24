"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Adventures", href: "/adventures", icon: "↗" },
  { label: "Our day", href: "/#our-day", icon: "☀" },
  { label: "Letters", href: "/#our-letters", icon: "✉" },
  { label: "Our now", href: "/#our-now", icon: "◌" },
  { label: "Thinking of you", href: "/#thinking-of-you", icon: "✦" },
] as const;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : href === "/adventures" && path.startsWith("/adventures");
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-stone-900/10 px-6 py-8 dark:border-white/10 lg:flex lg:flex-col">
      <Link href="/" className="group flex items-center gap-3" aria-label="Our Love Space home">
        <span className="grid size-12 place-items-center rounded-2xl bg-stone-950 text-lg font-semibold text-white shadow-lg shadow-stone-950/15 dark:bg-stone-50 dark:text-stone-950">
          OS
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-wide">Our Love Space</span>
          <span className="block text-xs text-stone-500 dark:text-stone-400">Private room for two</span>
        </span>
      </Link>

      <nav className="mt-12 space-y-2" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive(pathname, item.href)
                ? "bg-white/80 text-stone-950 shadow-sm dark:bg-white/10 dark:text-white"
                : "text-stone-600 hover:bg-white/55 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
            }`}
          >
            <span className="grid size-8 place-items-center rounded-xl bg-stone-100 text-base dark:bg-white/[0.08]">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-white/65 bg-white/50 p-4 text-sm text-stone-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-stone-300">
        <p className="font-medium text-stone-900 dark:text-stone-50">Tonight</p>
        <p className="mt-1 text-xs leading-5">A quiet place to leave a light on for each other.</p>
      </div>
    </aside>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 max-w-[calc(100vw-1.5rem)] rounded-[1.35rem] border border-white/70 bg-white/82 px-2 py-2 shadow-[0_20px_70px_rgba(48,35,30,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/78 lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-1">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[0.66rem] font-semibold transition ${
              isActive(pathname, item.href)
                ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950"
                : "text-stone-500 hover:bg-stone-950/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
        <details className="relative">
          <summary className="flex min-h-14 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-2xl text-[0.66rem] font-semibold"><span aria-hidden="true" className="text-lg leading-none">···</span>More</summary>
          <div className="absolute bottom-20 right-0 w-52 rounded-2xl border border-stone-500/20 bg-[#fff8f1] p-2 shadow-xl dark:bg-stone-900">
            {navItems.slice(4).map(item => <Link onClick={event => event.currentTarget.closest("details")?.removeAttribute("open")} className="block min-h-11 rounded-xl px-3 py-3 text-sm hover:bg-stone-500/10" key={item.href} href={item.href}>{item.label}</Link>)}
          </div>
        </details>
      </div>
    </nav>
  );
}
