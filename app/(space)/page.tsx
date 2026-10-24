import { HomePage } from "@/features/home/home-page";
import { loveSpaceHome } from "@/lib/mock-love-space";
import { getTrips } from "@/lib/adventures/data";
import { nextAdventure, currentAdventure } from "@/lib/adventures/upcoming";
import { NextTrip } from "@/features/adventures/next-trip";

export default async function Home() {
  const trips = await getTrips();
  const next = nextAdventure(trips);
  const featured = next ?? currentAdventure(trips);
  return <>
    {featured && <div className="mx-auto mb-5 max-w-6xl"><NextTrip trip={featured} compact ongoing={!next} /></div>}
    <HomePage home={loveSpaceHome} />
  </>;
}
