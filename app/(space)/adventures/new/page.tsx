import { Card, SectionLabel } from "@/components/ui/card";
import { TripForm } from "@/features/adventures/trip-form";

export default function NewTrip() {
  return <Card className="mx-auto max-w-2xl p-5 sm:p-8"><SectionLabel>Our Adventures</SectionLabel><h1 className="mb-7 mt-3 text-3xl font-semibold tracking-tight">A new place for us.</h1><TripForm id={crypto.randomUUID()} /></Card>;
}
