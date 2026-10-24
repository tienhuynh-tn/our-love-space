import { Card, SectionLabel } from "@/components/ui/card";
import { TripForm } from "@/features/adventures/trip-form";
import { getTrip } from "@/lib/adventures/data";

export default async function EditTrip({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await getTrip(tripId);
  return <Card className="p-5 sm:p-8"><SectionLabel>A little change of plan</SectionLabel><h1 className="mb-7 mt-3 text-3xl font-semibold tracking-tight">Edit our adventure</h1><TripForm id={trip.id} trip={trip} /></Card>;
}
