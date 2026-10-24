"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm, Field, secondaryClass } from "@/components/ui/action-form";
import { saveTrip } from "./actions";
import type { Trip, TripStatus } from "@/types/adventures";

export function TripForm({ id, trip }: { id: string; trip?: Trip }) {
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? "dreaming");
  return <ActionForm action={saveTrip} label={trip ? "Save our trip" : "Start our adventure"}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="edit" value={trip ? "true" : "false"} />
    <input type="hidden" name="revision" value={trip?.revision ?? 0} />
    <Field name="title" label="Give this adventure a name" defaultValue={trip?.title} maxLength={120} required placeholder="A few days by the sea" />
    <Field name="destination" label="Where are we going?" defaultValue={trip?.destination} maxLength={160} required placeholder="City, region, or country" />
    <Field name="status" label="Where this dream is now">
      <select name="status" className="travel-input" value={status} onChange={event => setStatus(event.target.value as TripStatus)}><option value="dreaming">Dreaming</option><option value="upcoming">Upcoming</option><option value="memories">Memories</option></select>
    </Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="start_date" label="First day" type="date" defaultValue={trip?.start_date ?? ""} required={status !== "dreaming"} min="1900-01-01" max="2200-12-31" />
      <Field name="end_date" label="Last day" type="date" defaultValue={trip?.end_date ?? ""} required={status !== "dreaming"} min="1900-01-01" max="2200-12-31" />
    </div>
    <Field name="timezone" label="Destination timezone" defaultValue={trip?.timezone ?? ""} required placeholder="Asia/Tokyo" maxLength={100} hint="Use an IANA timezone such as Asia/Tokyo or Europe/Paris. Countdown starts at midnight there on your first day." />
    <Field name="description" label="What are we looking forward to?">
      <textarea name="description" className="travel-input" rows={4} maxLength={5000} defaultValue={trip?.description} />
    </Field>
    <p className="text-xs leading-5 text-stone-600 dark:text-stone-400">You can add a private cover photo after saving.</p>
    <Link className={secondaryClass} href={trip ? `/adventures/${id}` : "/adventures"}>Cancel</Link>
  </ActionForm>;
}
