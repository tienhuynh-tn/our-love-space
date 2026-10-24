"use client";
import { buttonClass } from "@/components/ui/action-form";

export default function SpaceError({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6"><h1 className="text-2xl font-semibold">We couldn’t open our space.</h1><p className="text-sm leading-6">The connection may be taking a moment. Please try again.</p><button className={buttonClass} onClick={reset}>Try again</button></main>;
}
