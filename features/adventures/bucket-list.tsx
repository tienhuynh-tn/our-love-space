import Link from "next/link";
import { Card, SectionLabel } from "@/components/ui/card";
import { BucketForm, ConvertWish, DeleteItem } from "./forms";
import type { BucketItem, Trip } from "@/types/adventures";

export function BucketList({ items, trips }: { items: BucketItem[]; trips: Trip[] }) {
  return <section id="our-bucket-list" className="space-y-5 scroll-mt-6" aria-labelledby="bucket-heading">
    <div><SectionLabel>Our shared bucket list</SectionLabel><h2 id="bucket-heading" className="mt-2 text-2xl font-semibold tracking-tight">Little dreams. Someday stories.</h2></div>
    {!items.length && <p className="rounded-3xl border border-dashed border-stone-500/30 p-6 text-sm leading-6 text-stone-600 dark:text-stone-300">A place, a meal, a tiny experience. Keep the first thing you want to share.</p>}
    <div className="grid items-start gap-5 sm:grid-cols-2">{items.map(item => <Card key={item.id} className="space-y-3 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">{{ wishlist: "Someday", planned: "In our plans", completed: "We did this" }[item.status]}</p>
      <h3 className="break-words text-xl font-semibold">{item.title}</h3>
      {item.destination && <p className="break-words text-sm text-stone-600 dark:text-stone-300">{item.destination}</p>}
      {item.description && <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.description}</p>}
      {item.trip_id && <Link className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" href={`/adventures/${item.trip_id}${item.activity_id ? "/itinerary" : ""}`}>{trips.find(trip => trip.id === item.trip_id)?.title ?? "Our adventure"} ↗</Link>}
      {!item.activity_id && trips.length > 0 && <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Make a plan for this</summary><ConvertWish item={item} trips={trips} /></details>}
      <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Edit our wish</summary><BucketForm trips={trips} item={item} /></details>
      <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Remove wish</summary><DeleteItem item={item} kind="travel_bucket_items" /></details>
    </Card>)}</div>
    <Card className="p-5 sm:p-7"><h3 className="mb-5 text-xl font-semibold">Something we’d love to do</h3><BucketForm trips={trips} /></Card>
  </section>;
}
