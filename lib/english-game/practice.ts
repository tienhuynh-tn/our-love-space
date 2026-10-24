import { MAX_NUMBER, NUMBER_WORDS, numberAnswer, numberInEnglish, randomNumber, type NumberRange } from "./numbers.ts";

export const MODES = [
  { value: "numbers", label: "Numbers" },
  { value: "ordinals", label: "Ordinals" },
  { value: "dates", label: "Dates" },
  { value: "times", label: "Times" },
] as const;
export type PracticeMode = typeof MODES[number]["value"];
// Dates are UTC calendar-day offsets; times are minutes after midnight.
export type PracticePrompt = { mode: PracticeMode; value: number };
const DAY = 86_400_000;
const DATE_START = Date.UTC(2000, 0, 1);
export const DATE_COUNT = (Date.UTC(2100, 0, 1) - DATE_START) / DAY;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordinalWords: Record<string, string> = {
  one: "first", two: "second", three: "third", four: "fourth", five: "fifth", six: "sixth", seven: "seventh", eight: "eighth", nine: "ninth", ten: "tenth", eleven: "eleventh", twelve: "twelfth", thirteen: "thirteenth", fourteen: "fourteenth", fifteen: "fifteenth", sixteen: "sixteenth", seventeen: "seventeenth", eighteen: "eighteenth", nineteen: "nineteenth", twenty: "twentieth", thirty: "thirtieth", forty: "fortieth", fifty: "fiftieth", sixty: "sixtieth", seventy: "seventieth", eighty: "eightieth", ninety: "ninetieth", hundred: "hundredth", thousand: "thousandth", million: "millionth",
};

// Broad US word guides checked against https://github.com/cmusphinx/cmudict.
// Vietnamese hints are approximate memory aids, with capitals indicating stress.
const words: typeof NUMBER_WORDS = {
  ...NUMBER_WORDS,
  first: { ipa: "fɝst", vietnamese: "fơrst" },
  second: { ipa: "ˈsɛkənd", vietnamese: "SE-kần-d" },
  third: { ipa: "θɝd", vietnamese: "thơrd" },
  fourth: { ipa: "fɔrθ", vietnamese: "forth" },
  fifth: { ipa: "fɪfθ", vietnamese: "fifth" },
  sixth: { ipa: "sɪksθ", vietnamese: "siksth" },
  seventh: { ipa: "ˈsɛvənθ", vietnamese: "SE-vầnth" },
  eighth: { ipa: "eɪtθ", vietnamese: "âyt-th" },
  ninth: { ipa: "naɪnθ", vietnamese: "nainth" },
  tenth: { ipa: "tɛnθ", vietnamese: "tenth" },
  eleventh: { ipa: "ɪˈlɛvənθ", vietnamese: "i-LE-vầnth" },
  twelfth: { ipa: "twɛlfθ", vietnamese: "twelfth" },
  thirteenth: { ipa: "ˌθɝˈtiːnθ", vietnamese: "thơr-TIINTH" },
  fourteenth: { ipa: "ˌfɔrˈtiːnθ", vietnamese: "for-TIINTH" },
  fifteenth: { ipa: "ˌfɪfˈtiːnθ", vietnamese: "fif-TIINTH" },
  sixteenth: { ipa: "ˌsɪksˈtiːnθ", vietnamese: "siks-TIINTH" },
  seventeenth: { ipa: "ˌsɛvənˈtiːnθ", vietnamese: "se-vần-TIINTH" },
  eighteenth: { ipa: "ˌeɪˈtiːnθ", vietnamese: "ây-TIINTH" },
  nineteenth: { ipa: "ˌnaɪnˈtiːnθ", vietnamese: "nain-TIINTH" },
  twentieth: { ipa: "ˈtwɛntiəθ", vietnamese: "TWEN-ti-ợth" },
  thirtieth: { ipa: "ˈθɝtiəθ", vietnamese: "THƠR-ti-ợth" },
  fortieth: { ipa: "ˈfɔrtiɪθ", vietnamese: "FOR-ti-ith" },
  fiftieth: { ipa: "ˈfɪftiɪθ", vietnamese: "FIF-ti-ith" },
  sixtieth: { ipa: "ˈsɪkstiɪθ", vietnamese: "SIKS-ti-ith" },
  seventieth: { ipa: "ˈsɛvəntiɪθ", vietnamese: "SE-vần-ti-ith" },
  eightieth: { ipa: "ˈeɪtiɪθ", vietnamese: "ÂY-ti-ith" },
  ninetieth: { ipa: "ˈnaɪntiɪθ", vietnamese: "NAIN-ti-ith" },
  hundredth: { ipa: "ˈhʌndrədθ", vietnamese: "HÂN-drợdth" },
  thousandth: { ipa: "ˈθaʊzəndθ", vietnamese: "THAO-zần-dth" },
  millionth: { ipa: "ˈmɪljənθ", vietnamese: "MIL-yầnth" },
  january: { ipa: "ˈdʒænjuˌɛri", vietnamese: "JAN-yu-e-ri" },
  february: { ipa: "ˈfɛbjuˌɛri", vietnamese: "FEB-yu-e-ri" },
  march: { ipa: "mɑrtʃ", vietnamese: "march" },
  april: { ipa: "ˈeɪprəl", vietnamese: "ÂY-prầl" },
  may: { ipa: "meɪ", vietnamese: "mây" },
  june: { ipa: "dʒuːn", vietnamese: "juun" },
  july: { ipa: "dʒuˈlaɪ", vietnamese: "ju-LAI" },
  august: { ipa: "ˈɑɡəst", vietnamese: "A-gợst" },
  september: { ipa: "sɛpˈtɛmbɚ", vietnamese: "sep-TEM-bơr" },
  october: { ipa: "ɑkˈtoʊbɚ", vietnamese: "ak-TÂU-bơr" },
  november: { ipa: "noʊˈvɛmbɚ", vietnamese: "nâu-VEM-bơr" },
  december: { ipa: "dɪˈsɛmbɚ", vietnamese: "di-SEM-bơr" },
  oh: { ipa: "oʊ", vietnamese: "âu" },
  "o'clock": { ipa: "əˈklɑk", vietnamese: "ợ-KLAK" },
  "a.m.": { ipa: "ˌeɪ ˈɛm", vietnamese: "ây-EM" },
  "p.m.": { ipa: "ˈpiː ˈɛm", vietnamese: "PII-EM" },
};

export function ordinalInEnglish(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > MAX_NUMBER) throw new RangeError("Ordinal must be from 1 to 1,000,000.");
  return numberInEnglish(value).replace(/[a-z]+$/, word => ordinalWords[word]);
}
export function ordinalLabel(value: number): string {
  ordinalInEnglish(value);
  const lastTwo = value % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th");
  return `${value.toLocaleString("en-US")}${suffix}`;
}
export function practiceRange(mode: PracticeMode, range: NumberRange): NumberRange {
  if (mode === "dates") return { min: 0, max: DATE_COUNT - 1 };
  if (mode === "times") return { min: 0, max: 1439 };
  if (mode === "ordinals" && range.min < 1) throw new RangeError("Ordinal ranges start at 1.");
  return range;
}
export function nextPrompt(mode: PracticeMode, range: NumberRange, previous?: PracticePrompt, random = Math.random): PracticePrompt {
  return { mode, value: randomNumber(practiceRange(mode, range), previous?.mode === mode ? previous.value : undefined, random) };
}
export function practiceContent(prompt: PracticePrompt) {
  const { mode, value } = prompt;
  const bounds = practiceRange(mode, { min: mode === "ordinals" ? 1 : 0, max: MAX_NUMBER });
  if (!Number.isInteger(value) || value < bounds.min || value > bounds.max) throw new RangeError("Invalid practice prompt.");
  if (mode === "numbers") return { display: value.toLocaleString("en-US"), ...numberAnswer(value) };
  let display: string;
  let english: string;
  if (mode === "ordinals") {
    display = ordinalLabel(value);
    english = ordinalInEnglish(value);
  } else if (mode === "dates") {
    const date = new Date(DATE_START + value * DAY);
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const yearWords = year < 2010 ? numberInEnglish(year) : `twenty ${numberInEnglish(year % 100)}`;
    display = `${month.slice(0, 3)} ${date.getUTCDate()}, ${year}`;
    english = `${month} ${ordinalInEnglish(date.getUTCDate())}, ${yearWords}`;
  } else {
    const hour = Math.floor(value / 60);
    const minute = value % 60;
    const period = hour < 12 ? "AM" : "PM";
    display = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
    const minuteWords = minute === 0 ? "o'clock" : `${minute < 10 ? "oh " : ""}${numberInEnglish(minute)}`;
    english = `${numberInEnglish(hour % 12 || 12)} ${minuteWords} ${period.toLowerCase().split("").join(".")}.`;
  }
  const guide = english.toLowerCase().replaceAll(",", "").split(/[ -]+/).map(word => words[word]);
  return { display, english, ipa: `/${guide.map(word => word.ipa).join(" ")}/`, vietnamese: guide.map(word => word.vietnamese).join(" · ") };
}
