import { Card, SectionLabel } from "@/components/ui/card";
import { ActivityForm, ActivityOrder, DeleteItem } from "@/features/adventures/forms";
import { getActivities, getTrip } from "@/lib/adventures/data";
import { dateLabel } from "@/features/adventures/trip-card";

export default async function Itinerary({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [trip, activities] = await Promise.all([getTrip(tripId),getActivities(tripId)]);
  const days = [...new Set(activities.map(item => item.date))];
  return <div className="space-y-7">
    <div><SectionLabel>Our days, together</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight">Leave room for a little wandering.</h2><p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">Times are local to {trip.timezone}. Timed plans stay chronological; move plans sharing a time, or untimed plans, earlier or later.</p></div>
    {!activities.length && <Card className="p-6 text-sm leading-6">Our days are still a blank page. Add the first thing we’d love to do.</Card>}
    {days.map(day => <section key={day} className="space-y-4" aria-label={dateLabel(day)}><h3 className="text-lg font-semibold">{dateLabel(day)}</h3>
      <ol className="ml-2 space-y-5 border-l border-stone-500/30 pl-5">{activities.filter(item => item.date === day).map(activity => {
        const group = activities.filter(item => item.date === day && item.start_time === activity.start_time);
        const index = group.findIndex(item => item.id === activity.id);
        return <li key={activity.id} className="relative"><span aria-hidden="true" className="absolute -left-[1.65rem] top-6 size-3 rounded-full border-2 border-[#f7f0e7] bg-[#839b87] dark:border-stone-950" />
          <Card className="space-y-3 p-5"><p className="text-xs font-medium uppercase tracking-wider text-stone-600 dark:text-stone-400">{activity.start_time?.slice(0,5) ?? "When we feel like it"}{activity.completed ? " · Shared & remembered" : ""}</p>
            <h4 className="break-words text-xl font-semibold">{activity.title}</h4>
            {activity.location && <p className="break-words text-sm text-stone-600 dark:text-stone-300">{activity.location}</p>}
            {activity.description && <p className="whitespace-pre-wrap break-words text-sm leading-6">{activity.description}</p>}
            {activity.notes && <p className="whitespace-pre-wrap break-words rounded-xl bg-stone-500/5 p-3 text-sm leading-6">For us: {activity.notes}</p>}
            {activity.estimated_cost && <p className="text-sm">Estimated: {activity.estimated_cost} {activity.currency}</p>}
            <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Edit this plan</summary><ActivityForm trip={trip} activity={activity} /></details>
            <ActivityOrder activity={activity} first={index === 0} last={index === group.length - 1} />
            <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Remove activity</summary><DeleteItem item={activity} kind="trip_activities" /></details>
          </Card>
        </li>;
      })}</ol>
    </section>)}
    <Card className="p-5 sm:p-7"><h2 className="mb-5 text-xl font-semibold">A little plan for us</h2><ActivityForm trip={trip} /></Card>
  </div>;
}
