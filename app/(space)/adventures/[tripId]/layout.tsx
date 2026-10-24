import Link from "next/link";
import { getTrip, getPhotos, photoUrls } from "@/lib/adventures/data";
import { TripCover } from "@/features/adventures/trip-card";
import { Card } from "@/components/ui/card";
import { TripNavigation } from "@/features/adventures/trip-navigation";

export default async function TripLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await getTrip(tripId);
  const photos = trip.cover_photo_id ? (await getPhotos(tripId)).filter(p => p.id === trip.cover_photo_id) : [];
  const urls = await photoUrls(photos);
  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href="/adventures" className="inline-flex min-h-11 items-center text-sm font-medium">← All our adventures</Link>
    <Card className="overflow-hidden">
      <TripCover trip={trip} url={trip.cover_photo_id ? urls[trip.cover_photo_id] : undefined} large />
      <div className="p-5 sm:p-7"><p className="text-sm text-stone-600 dark:text-stone-400">{trip.destination}</p><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{trip.title}</h1></div>
      <TripNavigation tripId={tripId} />
    </Card>
    {children}
  </div>;
}
