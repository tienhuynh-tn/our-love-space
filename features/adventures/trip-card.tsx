import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/types/adventures";

export const statusLabel = { dreaming: "Dreaming", upcoming: "Upcoming", memories: "Memories" };
export function dateLabel(day: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}
export function TripCover({ trip, url, large = false }: { trip: Trip; url?: string; large?: boolean }) {
  return <div className={`relative isolate overflow-hidden bg-[#ccd7cd] dark:bg-[#25372f] ${large ? "h-56 sm:h-80" : "h-44"}`}>
    {url ? <Image src={url} alt={`Our adventure in ${trip.destination}`} fill sizes={large ? "(max-width: 1024px) 100vw, 900px" : "(max-width: 640px) 100vw, 450px"} className="object-cover" unoptimized /> : <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_30%,#f2d6ad_0%,transparent_45%),linear-gradient(155deg,transparent_50%,#809b86_50%,#b4c2ad_70%,#6f8c7c_70%)] opacity-65 dark:opacity-35" />}
    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
    <span className="absolute bottom-4 left-5 rounded-full bg-stone-950/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">{statusLabel[trip.status]}</span>
  </div>;
}
export function TripCard({ trip, url }: { trip: Trip; url?: string }) {
  return <Card className="overflow-hidden">
    <Link href={`/adventures/${trip.id}`} className="group block h-full rounded-[1.75rem]">
      <TripCover trip={trip} url={url} />
      <div className="p-5">
        <p className="text-xs font-medium tracking-wide text-stone-600 dark:text-stone-400">{trip.destination}</p>
        <h3 className="mt-2 break-words text-xl font-semibold tracking-tight group-hover:underline">{trip.title}</h3>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{trip.start_date ? `${dateLabel(trip.start_date)} — ${dateLabel(trip.end_date!)}` : "Someday, together"}</p>
      </div>
    </Link>
  </Card>;
}
