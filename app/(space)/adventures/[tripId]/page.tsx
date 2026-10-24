import Link from "next/link";
import { Card, SectionLabel } from "@/components/ui/card";
import { ActionForm, secondaryClass } from "@/components/ui/action-form";
import { getTrip } from "@/lib/adventures/data";
import { requirePair } from "@/lib/auth";
import { dateLabel } from "@/features/adventures/trip-card";
import { deleteTrip } from "@/features/adventures/actions";
import { PhotoUpload } from "@/features/adventures/photo-upload";
import { deletePhoto } from "@/features/adventures/photo-actions";

export default async function Overview({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await getTrip(tripId);
  const { pair } = await requirePair();
  const author = trip.created_by === pair.person_one ? pair.name_one : pair.name_two;
  return <Card className="space-y-6 p-5 sm:p-7">
    <SectionLabel>The shape of our adventure</SectionLabel>
    <p className="text-lg font-medium">{trip.start_date ? `${dateLabel(trip.start_date)} — ${dateLabel(trip.end_date!)}` : "No dates yet. There’s room to dream."}</p>
    <p className="whitespace-pre-wrap break-words leading-7 text-stone-600 dark:text-stone-300">{trip.description || "Leave a little note about what you’re looking forward to."}</p>
    <p className="text-xs leading-6 text-stone-600 dark:text-stone-400">Started by {author} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: trip.timezone }).format(new Date(trip.created_at))}<br />Trip days and times use {trip.timezone}.</p>
    <Link className={secondaryClass} href={`/adventures/${trip.id}/edit`}>Edit our trip</Link>
    <details className="border-t border-stone-500/20 pt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{trip.cover_photo_id ? "Change our cover photo" : "Add a cover photo"}</summary><PhotoUpload tripId={trip.id} revision={trip.revision} />
      {trip.cover_photo_id && <div className="mt-5"><ActionForm action={deletePhoto} label="Remove cover" confirm="Remove our cover photo?"><input type="hidden" name="id" value={trip.cover_photo_id} /></ActionForm></div>}
    </details>
    <details className="border-t border-stone-500/20 pt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm text-stone-600 dark:text-stone-400">Remove this adventure</summary><p className="my-4 text-sm leading-6">This removes its itinerary, expenses, memories, and photos for both of you. Travel wishes remain in the shared bucket list.</p>
      <ActionForm action={deleteTrip} label="Delete trip" confirm="Delete this trip and its itinerary, expenses, memories, and photos for both of you? This cannot be undone."><input type="hidden" name="id" value={trip.id} /><input type="hidden" name="revision" value={trip.revision} /></ActionForm>
    </details>
  </Card>;
}
