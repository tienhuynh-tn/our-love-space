"use server";

import { revalidatePath } from "next/cache";
import { requirePair } from "@/lib/auth";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, photoType } from "@/lib/adventures/photos";
import { revision, text, uuid, ValidationError } from "@/lib/adventures/validation";
import { cleanupPhotos } from "./actions";
import type { ActionState } from "@/types/adventures";

export async function uploadPhoto(form: FormData): Promise<ActionState> {
  const { supabase, userId } = await requirePair();
  let photoId: string | undefined;
  try {
    const tripId = uuid(text(form,"trip_id"));
    const memoryId = text(form,"memory_id") ? uuid(text(form,"memory_id")) : null;
    const file = form.get("photo");
    if (!(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.includes(file.type)) {
      return { error: "Choose a JPEG, PNG, or WebP photo up to 3 MB. Export HEIC photos as JPEG first." };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (photoType(bytes) !== file.type) return { error: "This file doesn’t match its image type. Try exporting the photo again." };
    const { data: trip, error: tripError } = await supabase.from("trips").select("id,cover_photo_id,revision").eq("id",tripId).maybeSingle();
    if (tripError || !trip) return { error: "This adventure is no longer available." };
    if (memoryId) {
      const { data: memory } = await supabase.from("travel_memories").select("id").eq("id",memoryId).eq("trip_id",tripId).maybeSingle();
      if (!memory) return { error: "This memory is no longer available." };
    } else if (trip.revision !== revision(form)) return { error: "The trip changed. Reload before replacing its cover." };
    photoId = crypto.randomUUID();
    const path = `${tripId}/${userId}/${photoId}`;
    const { error: manifestError } = await supabase.from("travel_photos").insert({ id: photoId, trip_id: tripId, memory_id: memoryId, storage_path: path, mime_type: file.type, byte_size: file.size });
    if (manifestError) throw manifestError;
    const { error: uploadError } = await supabase.storage.from("travel-photos").upload(path,bytes,{ contentType: file.type, cacheControl: "0", upsert: false });
    if (uploadError) throw uploadError;
    const { error: readyError } = await supabase.from("travel_photos").update({ ready: true }).eq("id",photoId);
    if (readyError) throw readyError;
    if (!memoryId) {
      const { data: saved, error: coverError } = await supabase.from("trips").update({ cover_photo_id: photoId }).eq("id",tripId).eq("revision",trip.revision).select("id").maybeSingle();
      if (coverError || !saved) throw new Error("Cover changed during upload.");
      if (trip.cover_photo_id) await supabase.from("travel_photos").delete().eq("id",trip.cover_photo_id).is("memory_id",null);
    }
    await cleanupPhotos();
    revalidatePath("/", "layout");
    return { success: memoryId ? "Photo added to our memory." : "Our cover photo is saved." };
  } catch (error) {
    if (photoId) {
      await supabase.from("travel_photos").delete().eq("id",photoId);
      await cleanupPhotos();
    }
    if (error instanceof ValidationError) return { fields: error.fields };
    return { error: "We couldn’t save this photo. Please reload and try again. Unfinished uploads will be cleaned up." };
  }
}
export async function deletePhoto(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const id = uuid(text(form,"id"));
    const { data: photo } = await supabase.from("travel_photos").select("id,trip_id").eq("id",id).maybeSingle();
    if (!photo) return { error: "This photo has already been removed." };
    const { error: clearError } = await supabase.from("trips").update({ cover_photo_id: null }).eq("id",photo.trip_id).eq("cover_photo_id",id);
    if (clearError) throw clearError;
    const { error } = await supabase.from("travel_photos").delete().eq("id",id);
    if (error) throw error;
    const pending = await cleanupPhotos();
    revalidatePath("/", "layout");
    return { success: pending ? "Photo removed. File cleanup is pending; use Retry photo cleanup." : "Photo removed." };
  } catch { return { error: "We couldn’t remove this photo. Please try again." }; }
}
