"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/action-form";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/adventures/photos";
import { uploadPhoto } from "./photo-actions";

export function PhotoUpload({ tripId, revision, memoryId }: { tripId: string; revision: number; memoryId?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending,start] = useTransition();
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);
  return <form onSubmit={event => {
    event.preventDefault();
    const files = Array.from(input.current?.files ?? []);
    if (!files.length || files.some(file => !PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES || !file.size)) {
      setError(true);setMessage("Choose JPEG, PNG, or WebP photos, up to 3 MB each.");return;
    }
    if (files.length > 12) { setError(true);setMessage("Add up to 12 photos at a time.");return; }
    start(async () => {
      setError(false);
      let added = 0;
      try {
        // Upload separately to stay below hosting request limits and bound memory use.
        for (const [index,file] of files.entries()) {
          setMessage(`Keeping photo ${index + 1} of ${files.length}…`);
          const data = new FormData();
          data.set("trip_id",tripId);data.set("revision",String(revision));data.set("photo",file);
          if (memoryId) data.set("memory_id",memoryId);
          const result = await uploadPhoto(data);
          if (result.error || result.fields) throw new Error(result.error ?? Object.values(result.fields!)[0]);
          added++;
        }
        setMessage(added === 1 ? "Photo saved." : `${added} photos saved.`);
      } catch (cause) {
        setError(true);setMessage(`${added ? `${added} photo(s) saved. ` : ""}${cause instanceof Error ? cause.message : "Upload interrupted. Please try again."}`);
      } finally {
        if (input.current) input.current.value = "";
        router.refresh();
      }
    });
  }} className="space-y-3">
    <label className="block space-y-2 text-sm font-medium"><span>{memoryId ? "Add photos to this memory" : "A cover for our adventure"}</span><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={!!memoryId} disabled={pending} required className="travel-input text-sm" /></label>
    <p className="text-xs leading-5 text-stone-600 dark:text-stone-400">JPEG, PNG, or WebP · 3 MB per photo{memoryId ? " · Up to 12 at a time" : ""}. Export HEIC photos as JPEG first.</p>
    <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Keeping our photos…" : memoryId ? "Add photos" : "Save cover photo"}</button>
    {message && <p role={error ? "alert" : "status"} className={`text-sm leading-6 ${error ? "text-red-800 dark:text-red-200" : "text-emerald-800 dark:text-emerald-200"}`}>{message}</p>}
  </form>;
}
