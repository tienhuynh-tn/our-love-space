"use client";
import Link from "next/link";
import { buttonClass, secondaryClass } from "@/components/ui/action-form";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-xl space-y-5 rounded-3xl bg-white/60 p-7 dark:bg-white/5"><h1 className="text-2xl font-semibold">A little pause in our plans.</h1><p className="text-sm leading-6">We couldn’t open this adventure. Your saved plans are still there. Please try again.</p><div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={reset}>Try again</button><Link className={secondaryClass} href="/adventures">Our adventures</Link></div></section>;
}
