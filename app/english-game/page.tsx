import type { Metadata } from "next";
import { NumberGame } from "@/features/english-game/number-game";
import { randomNumber } from "@/lib/english-game/numbers";

// Pass the initial prompt from the server so hydration uses the same random number.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "English Pronunciation Practice",
  description: "Practice saying English numbers, ordinals, dates, and times with voice recording, American English audio, IPA, and Vietnamese reading hints. No account needed.",
};

export default function EnglishGamePage() {
  return <NumberGame initialNumber={randomNumber({ min: 0, max: 100 })} />;
}
