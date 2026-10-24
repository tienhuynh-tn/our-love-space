"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePair } from "@/lib/auth";
import { activityInput, currencyCode, date, money, revision, text, tripInput, uuid, ValidationError } from "@/lib/adventures/validation";
import type { ActionState } from "@/types/adventures";

function failure(error: unknown): ActionState {
  if (error instanceof ValidationError) return { fields: error.fields };
  console.error("Adventure mutation failed:", error instanceof Error ? error.message : "Database request failed");
  return { error: "We couldn’t save that change. Please try again." };
}
const changed = { error: "This item changed or was removed. Reload the page before trying again." };
function refresh(tripId?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/adventures");
  if (tripId) revalidatePath(`/adventures/${tripId}`, "layout");
}
export async function saveTrip(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  let id: string;
  try {
    const input = tripInput(form);
    id = uuid(text(form, "id", 36, true));
    const edit = form.get("edit") === "true";
    const result = edit
      ? await supabase.from("trips").update(input).eq("id", id).eq("revision", revision(form)).select("id").maybeSingle()
      : await supabase.from("trips").insert({ ...input, id }).select("id").single();
    if (result.error) throw result.error;
    if (!result.data) return changed;
    refresh(id);
  } catch (error) { return failure(error); }
  redirect(`/adventures/${id}`);
}
export async function deleteTrip(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const id = uuid(text(form, "id"));
    const { data, error } = await supabase.from("trips").delete().eq("id", id).eq("revision", revision(form)).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return changed;
    await cleanupPhotos();
    refresh(id);
  } catch (error) { return failure(error); }
  redirect("/adventures");
}
export async function saveActivity(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const tripId = uuid(text(form, "trip_id"));
    const id = uuid(text(form, "id"));
    const input = activityInput(form);
    const result = form.get("edit") === "true"
      ? await supabase.from("trip_activities").update(input).eq("id", id).eq("trip_id", tripId).eq("revision", revision(form)).select("id").maybeSingle()
      : await supabase.from("trip_activities").insert({ ...input, id, trip_id: tripId }).select("id").single();
    if (result.error) throw result.error;
    if (!result.data) return changed;
    refresh(tripId);
    return { success: "Activity saved." };
  } catch (error) { return failure(error); }
}
export async function moveActivity(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const { error } = await supabase.rpc("move_activity", { activity_id: uuid(text(form,"id")), direction: Number(text(form,"direction")), expected_revision: revision(form) });
    if (error) return changed;
    refresh();
    return { success: "Activity moved." };
  } catch (error) { return failure(error); }
}
export async function saveBucketItem(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const id = uuid(text(form,"id"));
    const status = text(form,"status");
    if (!["wishlist","planned","completed"].includes(status)) throw new ValidationError({ status: "Choose a valid status." });
    const input = { title: text(form,"title",120,true), description: text(form,"description",3000), destination: text(form,"destination",160), status: status as "wishlist" | "planned" | "completed", trip_id: text(form,"trip_id") ? uuid(text(form,"trip_id")) : null };
    const result = form.get("edit") === "true"
      ? await supabase.from("travel_bucket_items").update(input).eq("id",id).eq("revision",revision(form)).select("id").maybeSingle()
      : await supabase.from("travel_bucket_items").insert({ ...input, id }).select("id").single();
    if (result.error) throw result.error;
    if (!result.data) return changed;
    refresh();
    return { success: "Travel wish saved." };
  } catch (error) { return failure(error); }
}
export async function convertBucketItem(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  let tripId: string;
  try {
    tripId = uuid(text(form,"trip_id"));
    const { error } = await supabase.rpc("convert_bucket_item", { item_id: uuid(text(form,"id")), target_trip: tripId, target_date: date(text(form,"date"))!, expected_revision: revision(form) });
    if (error) return changed;
    refresh(tripId);
  } catch (error) { return failure(error); }
  redirect(`/adventures/${tripId}/itinerary`);
}
export async function saveExpense(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, pair } = await requirePair();
  try {
    const id = uuid(text(form,"id"));
    const trip_id = uuid(text(form,"trip_id"));
    const currency = currencyCode(text(form,"currency",3,true));
    const paid_by = uuid(text(form,"paid_by"));
    const category = text(form,"category");
    if (![pair.person_one,pair.person_two].includes(paid_by)) throw new ValidationError({ paid_by: "Choose one of the two partners." });
    if (!["transport","stay","food","activities","shopping","other"].includes(category)) throw new ValidationError({ category: "Choose a valid category." });
    const input = { trip_id, description: text(form,"description",200,true), amount: money(text(form,"amount"),currency)!, currency, paid_by, category, date: date(text(form,"date"))! };
    const result = form.get("edit") === "true"
      ? await supabase.from("travel_expenses").update(input).eq("id",id).eq("trip_id",trip_id).eq("revision",revision(form)).select("id").maybeSingle()
      : await supabase.from("travel_expenses").insert({ ...input,id }).select("id").single();
    if (result.error) throw result.error;
    if (!result.data) return changed;
    refresh(trip_id);
    return { success: "Expense saved." };
  } catch (error) { return failure(error); }
}
export async function saveMemory(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const id = uuid(text(form,"id"));
    const trip_id = uuid(text(form,"trip_id"));
    const input = { trip_id, caption: text(form,"caption",3000), date: date(text(form,"date"))!, location: text(form,"location",200) };
    const result = form.get("edit") === "true"
      ? await supabase.from("travel_memories").update(input).eq("id",id).eq("trip_id",trip_id).eq("revision",revision(form)).select("id").maybeSingle()
      : await supabase.from("travel_memories").insert({ ...input,id }).select("id").single();
    if (result.error) throw result.error;
    if (!result.data) return changed;
    refresh(trip_id);
    return { success: "Memory saved. You can add photos below." };
  } catch (error) { return failure(error); }
}
export async function deleteItem(_state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requirePair();
  try {
    const kind = text(form,"kind");
    if (!["trip_activities","travel_bucket_items","travel_memories","travel_expenses"].includes(kind)) throw new ValidationError({ kind: "Choose a valid item." });
    const table = kind as "trip_activities" | "travel_bucket_items" | "travel_memories" | "travel_expenses";
    const { data, error } = await supabase.from(table).delete().eq("id",uuid(text(form,"id"))).eq("revision",revision(form)).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return changed;
    const pending = await cleanupPhotos();
    refresh();
    return { success: pending ? "Removed. Some photo files still need cleanup; use Retry photo cleanup." : "Removed." };
  } catch (error) { return failure(error); }
}
export async function cleanupPhotos(): Promise<boolean> {
  const { supabase } = await requirePair();
  // Abandoned manifests are kept out of journals and safely queued for removal.
  await supabase.from("travel_photos").delete().eq("ready",false).lt("created_at",new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const { data, error } = await supabase.from("photo_cleanup").select("storage_path").order("created_at").limit(100);
  if (error) return true;
  if (!data.length) return false;
  const paths = data.map(row => row.storage_path);
  const result = await supabase.storage.from("travel-photos").remove(paths);
  if (result.error) return true;
  const removed = await supabase.from("photo_cleanup").delete().in("storage_path",paths);
  return !!removed.error || data.length === 100;
}
export async function retryCleanup(): Promise<ActionState> {
  const pending = await cleanupPhotos();
  refresh();
  return pending ? { error: "Photo cleanup is still pending. Please try again shortly." } : { success: "Photo cleanup is complete." };
}
