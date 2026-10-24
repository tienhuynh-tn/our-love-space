import { ActionForm, Field } from "@/components/ui/action-form";
import { convertBucketItem, deleteItem, moveActivity, saveActivity, saveBucketItem, saveExpense, saveMemory } from "./actions";
import type { Activity, BucketItem, Expense, Memory, Pair, Trip } from "@/types/adventures";

export function Identity({ item, tripId }: { item?: { id: string; revision: number }; tripId?: string }) {
  return <><input type="hidden" name="id" value={item?.id ?? crypto.randomUUID()} /><input type="hidden" name="revision" value={item?.revision ?? 0} /><input type="hidden" name="edit" value={item ? "true" : "false"} />{tripId && <input type="hidden" name="trip_id" value={tripId} />}</>;
}
function DateField({ value, label = "Day" }: { value?: string; label?: string }) {
  return <Field name="date" label={label} type="date" defaultValue={value} required min="1900-01-01" max="2200-12-31" />;
}
export function DeleteItem({ item, kind }: { item: { id: string; revision: number }; kind: string }) {
  return <ActionForm action={deleteItem} label="Remove" confirm="Remove this item for both of you? This cannot be undone."><Identity item={item} /><input type="hidden" name="kind" value={kind} /></ActionForm>;
}
export function ActivityForm({ trip, activity }: { trip: Trip; activity?: Activity }) {
  return <ActionForm action={saveActivity} label={activity ? "Save activity" : "Add to our day"} reset={!activity}>
    <Identity item={activity} tripId={trip.id} />
    <Field name="title" label="What shall we do?" required maxLength={120} defaultValue={activity?.title} />
    <div className="grid gap-4 sm:grid-cols-2"><DateField value={activity?.date ?? trip.start_date ?? undefined} /><Field name="start_time" label="Time · optional" type="time" defaultValue={activity?.start_time?.slice(0,5) ?? ""} /></div>
    <Field name="location" label="Place · optional" maxLength={200} defaultValue={activity?.location} />
    <Field name="description" label="A little about it"><textarea className="travel-input" name="description" rows={2} maxLength={3000} defaultValue={activity?.description} /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field name="estimated_cost" label="Estimated cost · optional" inputMode="decimal" defaultValue={activity?.estimated_cost ?? ""} /><Field name="currency" label="Currency code" maxLength={3} placeholder="USD" defaultValue={activity?.currency ?? ""} /></div>
    <Field name="notes" label="Notes for us"><textarea className="travel-input" name="notes" rows={2} maxLength={3000} defaultValue={activity?.notes} /></Field>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="completed" defaultChecked={activity?.completed} className="size-5 accent-stone-800" />We did this together</label>
  </ActionForm>;
}
export function ActivityOrder({ activity, first, last }: { activity: Activity; first: boolean; last: boolean }) {
  return <div className="flex flex-wrap gap-3">{[[-1,"Move earlier",first],[1,"Move later",last]].map(([direction,label,disabled]) => !disabled && <ActionForm key={String(direction)} action={moveActivity} label={String(label)}><Identity item={activity} /><input type="hidden" name="direction" value={String(direction)} /></ActionForm>)}</div>;
}
function TripSelect({ trips, selected, required = false }: { trips: Trip[]; selected?: string | null; required?: boolean }) {
  return <Field name="trip_id" label={required ? "Choose an adventure" : "Related adventure · optional"}><select className="travel-input" name="trip_id" defaultValue={selected ?? ""} required={required}><option value="">{required ? "Choose a trip" : "Just a wish, for now"}</option>{trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}</select></Field>;
}
export function BucketForm({ trips, item }: { trips: Trip[]; item?: BucketItem }) {
  return <ActionForm action={saveBucketItem} label={item ? "Save wish" : "Keep this little dream"} reset={!item}>
    <Identity item={item} />
    <Field name="title" label="Something we want to experience" required maxLength={120} defaultValue={item?.title} placeholder="Watch the sunrise by the sea" />
    <Field name="description" label="Why we’d love it"><textarea className="travel-input" name="description" rows={2} maxLength={3000} defaultValue={item?.description} /></Field>
    <Field name="destination" label="Somewhere in particular? · optional" maxLength={160} defaultValue={item?.destination} />
    <Field name="status" label="Where this wish is now"><select className="travel-input" name="status" defaultValue={item?.status ?? "wishlist"}><option value="wishlist">Wishlist</option><option value="planned">Planned</option><option value="completed">Completed</option></select></Field>
    {item?.activity_id ? <><input type="hidden" name="trip_id" value={item.trip_id ?? ""} /><p className="text-sm">Linked to {trips.find(trip => trip.id === item.trip_id)?.title ?? "our adventure"}. Edit the converted activity in its itinerary.</p></> : <TripSelect trips={trips} selected={item?.trip_id} />}
  </ActionForm>;
}
export function ConvertWish({ item, trips }: { item: BucketItem; trips: Trip[] }) {
  return <ActionForm action={convertBucketItem} label="Add to our itinerary"><Identity item={item} /><TripSelect trips={trips} selected={item.trip_id} required /><DateField label="Which day?" /></ActionForm>;
}
export function ExpenseForm({ trip, pair, expense }: { trip: Trip; pair: Pair; expense?: Expense }) {
  return <ActionForm action={saveExpense} label={expense ? "Save expense" : "Add expense"} reset={!expense}>
    <Identity item={expense} tripId={trip.id} />
    <Field name="description" label="What was it for?" defaultValue={expense?.description} required maxLength={200} />
    <div className="grid gap-4 sm:grid-cols-2"><Field name="amount" label="Amount" inputMode="decimal" required defaultValue={expense?.amount} /><Field name="currency" label="Currency code" placeholder="VND" required maxLength={3} defaultValue={expense?.currency} /></div>
    <Field name="paid_by" label="Who paid?"><select className="travel-input" name="paid_by" defaultValue={expense?.paid_by ?? ""} required><option value="">Choose a partner</option><option value={pair.person_one}>{pair.name_one}</option><option value={pair.person_two}>{pair.name_two}</option></select></Field>
    <Field name="category" label="Category"><select className="travel-input" name="category" defaultValue={expense?.category ?? "food"}>{["transport","stay","food","activities","shopping","other"].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></Field>
    <DateField value={expense?.date ?? trip.start_date ?? undefined} />
  </ActionForm>;
}
export function MemoryForm({ trip, memory }: { trip: Trip; memory?: Memory }) {
  return <ActionForm action={saveMemory} label={memory ? "Save memory" : "Keep this moment"} reset={!memory}>
    <Identity item={memory} tripId={trip.id} />
    <Field name="caption" label="A moment we want to keep"><textarea className="travel-input" name="caption" rows={3} maxLength={3000} defaultValue={memory?.caption} /></Field>
    <DateField value={memory?.date ?? trip.start_date ?? undefined} />
    <Field name="location" label="Where it happened · optional" maxLength={200} defaultValue={memory?.location} />
    {!memory && <p className="text-xs leading-5 text-stone-600 dark:text-stone-400">Save the moment, then add one or more photos to it.</p>}
  </ActionForm>;
}
