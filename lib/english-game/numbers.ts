export const MAX_NUMBER = 1_000_000;
export type NumberRange = { min: number; max: number };
export const LEVELS = [
  { value: "beginner", label: "Small steps", description: "0–100", min: 0, max: 100 },
  { value: "hundreds", label: "A little further", description: "0–1,000", min: 0, max: 1000 },
  { value: "millions", label: "Think bigger", description: "0–1,000,000", min: 0, max: MAX_NUMBER },
] as const;

const small = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

// Broad US word pronunciations, checked against CMUdict's American English lexicon:
// https://github.com/cmusphinx/cmudict . These are word guides, not connected-speech transcriptions.
// Vietnamese hints are original, approximate memory aids; capitals indicate stress.
export const NUMBER_WORDS: Record<string, { ipa: string; vietnamese: string }> = {
  zero: { ipa: "ˈzɪroʊ", vietnamese: "ZI-râu" },
  one: { ipa: "wʌn", vietnamese: "oăn" },
  two: { ipa: "tuː", vietnamese: "tu" },
  three: { ipa: "θriː", vietnamese: "thri" },
  four: { ipa: "fɔr", vietnamese: "fo(r)" },
  five: { ipa: "faɪv", vietnamese: "fai-v" },
  six: { ipa: "sɪks", vietnamese: "sik-s" },
  seven: { ipa: "ˈsɛvən", vietnamese: "SE-vần" },
  eight: { ipa: "eɪt", vietnamese: "ây-t" },
  nine: { ipa: "naɪn", vietnamese: "nai-n" },
  ten: { ipa: "tɛn", vietnamese: "ten" },
  eleven: { ipa: "ɪˈlɛvən", vietnamese: "i-LE-vần" },
  twelve: { ipa: "twɛlv", vietnamese: "twel-v" },
  thirteen: { ipa: "ˌθɝˈtiːn", vietnamese: "thơr-TIIN" },
  fourteen: { ipa: "ˌfɔrˈtiːn", vietnamese: "for-TIIN" },
  fifteen: { ipa: "ˌfɪfˈtiːn", vietnamese: "fif-TIIN" },
  sixteen: { ipa: "ˌsɪksˈtiːn", vietnamese: "siks-TIIN" },
  seventeen: { ipa: "ˌsɛvənˈtiːn", vietnamese: "se-vần-TIIN" },
  eighteen: { ipa: "ˌeɪˈtiːn", vietnamese: "ây-TIIN" },
  nineteen: { ipa: "ˌnaɪnˈtiːn", vietnamese: "nain-TIIN" },
  twenty: { ipa: "ˈtwɛnti", vietnamese: "TWEN-ti" },
  thirty: { ipa: "ˈθɝti", vietnamese: "THƠR-ti" },
  forty: { ipa: "ˈfɔrti", vietnamese: "FOR-ti" },
  fifty: { ipa: "ˈfɪfti", vietnamese: "FIF-ti" },
  sixty: { ipa: "ˈsɪksti", vietnamese: "SIKS-ti" },
  seventy: { ipa: "ˈsɛvənti", vietnamese: "SE-vần-ti" },
  eighty: { ipa: "ˈeɪti", vietnamese: "ÂY-ti" },
  ninety: { ipa: "ˈnaɪnti", vietnamese: "NAIN-ti" },
  hundred: { ipa: "ˈhʌndrəd", vietnamese: "HÂN-drợd" },
  thousand: { ipa: "ˈθaʊzənd", vietnamese: "THAO-zần" },
  million: { ipa: "ˈmɪljən", vietnamese: "MIL-yần" },
};

export function parseRange(min: string, max: string): NumberRange {
  if (!/^\d+$/.test(min.trim()) || !/^\d+$/.test(max.trim())) throw new Error("Enter whole numbers for both ends of the range.");
  const range = { min: Number(min), max: Number(max) };
  if (!Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || range.min < 0 || range.max > MAX_NUMBER || range.min > range.max) {
    throw new Error("Choose a range from 0 to 1,000,000, with the minimum no greater than the maximum.");
  }
  return range;
}

export function randomNumber(range: NumberRange, previous?: number, random = Math.random): number {
  if (!Number.isInteger(range.min) || !Number.isInteger(range.max) || range.min < 0 || range.max > MAX_NUMBER || range.min > range.max) throw new RangeError("Invalid number range.");
  const count = range.max - range.min + 1;
  if (count === 1) return range.min;
  // Sample the remaining values directly, rather than retrying indefinitely.
  const excludePrevious = previous !== undefined && previous >= range.min && previous <= range.max;
  const sample = range.min + Math.floor(random() * (count - (excludePrevious ? 1 : 0)));
  return excludePrevious && sample >= previous ? sample + 1 : sample;
}

export function numberInEnglish(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > MAX_NUMBER) throw new RangeError("Number must be a whole number from 0 to 1,000,000.");
  if (value < 20) return small[value];
  if (value < 100) return tens[Math.floor(value / 10)] + (value % 10 ? `-${small[value % 10]}` : "");
  if (value < 1000) return `${small[Math.floor(value / 100)]} hundred${value % 100 ? ` ${numberInEnglish(value % 100)}` : ""}`;
  if (value < MAX_NUMBER) return `${numberInEnglish(Math.floor(value / 1000))} thousand${value % 1000 ? ` ${numberInEnglish(value % 1000)}` : ""}`;
  return "one million";
}

export function numberAnswer(value: number) {
  const english = numberInEnglish(value);
  const words = english.split(/[ -]+/).map(word => NUMBER_WORDS[word]);
  return { english, ipa: `/${words.map(word => word.ipa).join(" ")}/`, vietnamese: words.map(word => word.vietnamese).join(" · ") };
}
