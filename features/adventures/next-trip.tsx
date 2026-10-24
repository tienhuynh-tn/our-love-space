import Link from "next/link";
import { Card, SectionLabel } from "@/components/ui/card";
import { Countdown } from "@/components/space/live-time";
import { TripCover } from "./trip-card";
import { departureInstant } from "@/lib/adventures/validation";
import type { Trip } from "@/types/adventures";

export function NextTrip({ trip, url, compact = false, ongoing = false }: { trip: Trip; url?: string; compact?: boolean; ongoing?: boolean }) {
  return <Card className={`overflow-hidden ${compact ? "" : "sm:grid sm:grid-cols-2"}`}>
    {!compact && <TripCover trip={trip} url={url} large />}
    <div className="flex flex-col justify-center space-y-4 p-5 sm:p-7"><SectionLabel>{ongoing ? "Our adventure, right now" : "Our next adventure"}</SectionLabel>
      <h2 className="break-words text-2xl font-semibold tracking-tight"><Link href={`/adventures/${trip.id}`} className="underline-offset-4 hover:underline">{trip.title} <span aria-hidden="true">↗</span></Link></h2>
      <p className="text-sm text-stone-600 dark:text-stone-300">{trip.destination}</p>
      {ongoing ? <p className="text-sm font-medium">We’re here, together. Keep a little of today.</p> : <Countdown startsAt={departureInstant(trip.start_date!,trip.timezone)} arrivedLabel="Our departure day is here." />}
    </div>
  </Card>;
}
