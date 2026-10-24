import type { Trip } from "@/types/adventures";
import { departureInstant } from "./validation.ts";

export function nextAdventure(trips: Trip[], now = new Date()) {
  return trips.filter(trip => trip.status === "upcoming" && trip.start_date && new Date(departureInstant(trip.start_date,trip.timezone)) > now)
    .sort((a,b) => departureInstant(a.start_date!,a.timezone).localeCompare(departureInstant(b.start_date!,b.timezone)))[0] ?? null;
}
export function currentAdventure(trips: Trip[], now = new Date()) {
  return trips.find(trip => {
    if (trip.status !== "upcoming" || !trip.start_date || !trip.end_date) return false;
    const tomorrow = new Date(`${trip.end_date}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return new Date(departureInstant(trip.start_date,trip.timezone)) <= now && new Date(departureInstant(tomorrow.toISOString().slice(0,10),trip.timezone)) > now;
  }) ?? null;
}
