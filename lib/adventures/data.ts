import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requirePair } from "@/lib/auth";
import type { Photo } from "@/types/adventures";

export const getTrips = cache(async () => {
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("trips").select("*").order("start_date", { nullsFirst: false }).order("created_at", { ascending: false });
  if (error) throw new Error("We couldn’t load your adventures. Please try again.");
  return data;
});
export const getTrip = cache(async (id: string) => {
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("We couldn’t load this adventure. Please try again.");
  if (!data) notFound();
  return data;
});
export async function getBucketItems() {
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("travel_bucket_items").select("*").order("created_at");
  if (error) throw new Error("We couldn’t load your travel wishes.");
  return data;
}
export async function getActivities(tripId: string) {
  await getTrip(tripId);
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("trip_activities").select("*").eq("trip_id", tripId)
    .order("date").order("start_time", { nullsFirst: false }).order("sort_order").order("created_at").order("id");
  if (error) throw new Error("We couldn’t load your itinerary.");
  return data;
}
export async function getExpenses(tripId: string) {
  await getTrip(tripId);
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("travel_expenses").select("*").eq("trip_id", tripId).order("date").order("created_at");
  if (error) throw new Error("We couldn’t load your expenses.");
  return data;
}
export async function getMemories(tripId: string) {
  await getTrip(tripId);
  const { supabase } = await requirePair();
  const { data, error } = await supabase.from("travel_memories").select("*").eq("trip_id", tripId).order("date").order("created_at");
  if (error) throw new Error("We couldn’t load your memories.");
  return data;
}
export async function getPhotos(tripId?: string) {
  const { supabase } = await requirePair();
  let query = supabase.from("travel_photos").select("*").eq("ready",true).order("created_at").order("id");
  if (tripId) query = query.eq("trip_id", tripId);
  const { data, error } = await query;
  if (error) throw new Error("We couldn’t load your photos.");
  return data;
}
export async function photoUrls(photos: Photo[]) {
  if (!photos.length) return {} as Record<string, string>;
  const { supabase } = await requirePair();
  const { data, error } = await supabase.storage.from("travel-photos").createSignedUrls(photos.map(p => p.storage_path), 600);
  if (error) throw new Error("We couldn’t open your private photos. Please refresh to try again.");
  return Object.fromEntries(photos.flatMap((photo, i) => data[i]?.signedUrl ? [[photo.id, data[i].signedUrl]] : []));
}
