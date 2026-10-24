import Link from "next/link";
import { Card, SectionLabel } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/action-form";
import { getTrips, getPhotos, getBucketItems, photoUrls } from "@/lib/adventures/data";
import { TripCard } from "@/features/adventures/trip-card";
import { BucketList } from "@/features/adventures/bucket-list";
import { NextTrip } from "@/features/adventures/next-trip";
import { nextAdventure, currentAdventure } from "@/lib/adventures/upcoming";

export default async function Adventures() {
  const [trips, photos, bucket] = await Promise.all([getTrips(),getPhotos(),getBucketItems()]);
  const urls = await photoUrls(photos.filter(photo => trips.some(trip => trip.cover_photo_id === photo.id)));
  const next = nextAdventure(trips);
  const current = currentAdventure(trips);
  const featured = next ?? current;
  return <div className="mx-auto max-w-5xl space-y-9">
    <Card className="relative overflow-hidden p-6 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-[#c9d8cf]/45 blur-3xl dark:bg-[#6f9183]/15" />
      <div className="relative"><SectionLabel>Our Adventures</SectionLabel>
        <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Somewhere new.<br />Always with you.</h1>
        <p className="mb-6 mt-4 max-w-md text-base leading-7 text-stone-600 dark:text-stone-300">The places we dream of, the plans we make, and the little things we’ll remember.</p>
        <Link href="/adventures/new" className={buttonClass}>Dream up a trip <span aria-hidden="true" className="ml-3">↗</span></Link>
      </div>
    </Card>
    {featured && <NextTrip trip={featured} url={featured.cover_photo_id ? urls[featured.cover_photo_id] : undefined} ongoing={!next} />}
    {(["upcoming","dreaming","memories"] as const).map(status => {
      const group = trips.filter(trip => trip.status === status);
      return <section key={status} aria-labelledby={`heading-${status}`} className="space-y-4">
        <h2 id={`heading-${status}`} className="text-2xl font-semibold tracking-tight">{{ upcoming: "On our horizon", dreaming: "Places in our dreams", memories: "Adventures we’ll keep" }[status]}</h2>
        {group.length ? <div className="grid gap-5 sm:grid-cols-2">{group.map(trip => <TripCard key={trip.id} trip={trip} url={trip.cover_photo_id ? urls[trip.cover_photo_id] : undefined} />)}</div> : <div className="rounded-3xl border border-dashed border-stone-500/30 p-6 text-sm leading-6 text-stone-600 dark:text-stone-300">{{ upcoming: "Nothing on the calendar yet. A little dream can become our next plan.", dreaming: "Where would you like to wake up together? Start with one place.", memories: "Our first adventure will find its home here when we’re ready to look back." }[status]}</div>}
      </section>;
    })}
    <BucketList items={bucket} trips={trips} />
  </div>;
}
