import Image from "next/image";
import { Card, SectionLabel } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { MemoryForm, DeleteItem } from "@/features/adventures/forms";
import { PhotoUpload } from "@/features/adventures/photo-upload";
import { deletePhoto } from "@/features/adventures/photo-actions";
import { retryCleanup } from "@/features/adventures/actions";
import { getTrip, getMemories, getPhotos, photoUrls } from "@/lib/adventures/data";
import { requirePair } from "@/lib/auth";
import { dateLabel } from "@/features/adventures/trip-card";

export default async function Memories({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [trip,memories,photos,{ pair }] = await Promise.all([getTrip(tripId),getMemories(tripId),getPhotos(tripId),requirePair()]);
  const urls = await photoUrls(photos);
  return <div className="space-y-7">
    <div><SectionLabel>Our travel journal</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight">The things we’ll come back to.</h2><p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">A place for the big views and the tiny moments in between.</p></div>
    {!memories.length && <Card className="p-6 text-sm leading-6">No moments here yet. Start with something you want us to remember.</Card>}
    {memories.map(memory => <Card key={memory.id} className="space-y-5 p-5 sm:p-7">
      <div><time className="text-xs font-semibold tracking-wide text-stone-600 dark:text-stone-400" dateTime={memory.date}>{dateLabel(memory.date)}</time><h3 className="mt-2 text-lg font-medium">{memory.location || "A moment with you"}</h3><p className="mt-1 text-xs text-stone-600 dark:text-stone-400">Kept by {memory.created_by === pair.person_one ? pair.name_one : pair.name_two}</p></div>
      {memory.caption && <p className="whitespace-pre-wrap break-words leading-7">{memory.caption}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{photos.filter(photo => photo.memory_id === memory.id).map((photo,index) => <figure key={photo.id} className="min-w-0 space-y-2">
        {urls[photo.id] ? <a href={urls[photo.id]} target="_blank" rel="noreferrer" aria-label={`Open photo ${index + 1} at full size`} className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-stone-500/10"><Image src={urls[photo.id]} alt={`${memory.location || trip.destination}, ${dateLabel(memory.date)}, photo ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 450px" className="object-cover" unoptimized /></a> : <p className="rounded-2xl bg-stone-500/10 p-5 text-sm">This photo is temporarily unavailable. Refresh to try again.</p>}
        <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Remove photo {index + 1}</summary><ActionForm action={deletePhoto} label="Remove photo" confirm="Remove this photo for both of you?"><input type="hidden" name="id" value={photo.id} /></ActionForm></details>
      </figure>)}</div>
      <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Add photos</summary><PhotoUpload tripId={tripId} revision={trip.revision} memoryId={memory.id} /></details>
      <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Edit this memory</summary><MemoryForm trip={trip} memory={memory} /></details>
      <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Remove memory and photos</summary><DeleteItem item={memory} kind="travel_memories" /></details>
    </Card>)}
    <Card className="p-5 sm:p-7"><h2 className="mb-5 text-xl font-semibold">Keep a little of today</h2><MemoryForm trip={trip} /></Card>
    <details className="px-2"><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Photo storage</summary><p className="mb-4 text-sm leading-6">If a connection interrupted a photo removal, safely retry clearing the leftover files.</p><ActionForm action={retryCleanup} label="Retry photo cleanup" /></details>
  </div>;
}
