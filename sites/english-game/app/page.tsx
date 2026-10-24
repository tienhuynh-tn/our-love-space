import { NumberGame } from "@/features/english-game/number-game";

export default function Page() {
  // A stable first prompt makes static HTML and hydration agree.
  return <NumberGame initialNumber={21} showPrivateLink={false} />;
}
