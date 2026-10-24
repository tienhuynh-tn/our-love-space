import type { TripStatus } from "@/types/adventures";

export class ValidationError extends Error {
  fields: Record<string, string>;
  constructor(fields: Record<string, string>) {
    super(Object.values(fields)[0]);
    this.fields = fields;
  }
}
export function text(form: FormData, key: string, max = 2000, required = false) {
  const value = form.get(key);
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new ValidationError({ [key]: "This field is required." });
  if (result.length > max) throw new ValidationError({ [key]: `Use ${max} characters or fewer.` });
  return result;
}
export function uuid(value: string, key = "id") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ValidationError({ [key]: "Choose a valid item." });
  }
  return value;
}
export function date(value: string, key = "date", optional = false): string | null {
  if (!value && optional) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value < "1900-01-01" || value > "2200-12-31") {
    throw new ValidationError({ [key]: "Choose a valid date between 1900 and 2200." });
  }
  return value;
}
export function revision(form: FormData) {
  const value = text(form, "revision", 10, true);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new ValidationError({ revision: "Reload this item before saving." });
  return Number(value);
}
export function tripInput(form: FormData) {
  const status = text(form, "status") as TripStatus;
  if (!["dreaming", "upcoming", "memories"].includes(status)) throw new ValidationError({ status: "Choose a trip status." });
  const start_date = date(text(form, "start_date"), "start_date", status === "dreaming");
  const end_date = date(text(form, "end_date"), "end_date", status === "dreaming");
  if ((start_date && !end_date) || (!start_date && end_date) || (start_date && end_date && end_date < start_date)) {
    throw new ValidationError({ end_date: "Choose both dates, with the end on or after the start." });
  }
  const timezone = text(form, "timezone", 100, true);
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); }
  catch { throw new ValidationError({ timezone: "Use an IANA timezone, for example Asia/Tokyo." }); }
  return { title: text(form, "title", 120, true), destination: text(form, "destination", 160, true), description: text(form, "description", 5000), status, start_date, end_date, timezone };
}
const currencies = new Set(Intl.supportedValuesOf("currency"));
export function currencyCode(value: string) {
  const code = value.toUpperCase();
  if (!currencies.has(code)) throw new ValidationError({ currency: "Use a supported three-letter currency code." });
  return code;
}
export function currencyDigits(currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}
// Money crosses JSON boundaries as decimal strings, never floating-point totals.
export function money(value: string, currency: string, optional = false) {
  if (!value && optional) return null;
  const digits = currencyDigits(currency);
  if (!/^\d{1,12}(\.\d{1,3})?$/.test(value) || (value.split(".")[1]?.length ?? 0) > digits) {
    throw new ValidationError({ amount: `Enter an amount with at most ${digits} decimal places.` });
  }
  const normalized = value.replace(/^0+(?=\d)/, "");
  if (decimalUnits(normalized, digits) <= BigInt(0)) throw new ValidationError({ amount: "Amount must be greater than zero." });
  return normalized;
}
function decimalUnits(value: string, digits: number) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10) ** BigInt(digits) + BigInt(fraction.padEnd(digits, "0") || "0");
}
export function sumMoney(values: string[], currency: string) {
  const digits = currencyDigits(currency);
  const units = values.reduce((sum, value) => sum + decimalUnits(value, digits), BigInt(0));
  const raw = units.toString().padStart(digits + 1, "0");
  return digits ? `${raw.slice(0, -digits)}.${raw.slice(-digits)}` : raw;
}
export function activityInput(form: FormData) {
  const start_time = text(form, "start_time") || null;
  if (start_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time)) throw new ValidationError({ start_time: "Choose a valid time." });
  const cost = text(form, "estimated_cost");
  const currency = cost ? currencyCode(text(form, "currency", 3, true)) : null;
  return { title: text(form, "title", 120, true), date: date(text(form, "date"))!, start_time,
    location: text(form, "location", 200), description: text(form, "description", 3000), notes: text(form, "notes", 3000),
    estimated_cost: cost && currency ? money(cost, currency) : null, currency, completed: form.get("completed") === "on" };
}
export function departureInstant(day: string, timezone: string) {
  // Solve destination-local midnight, including fractional UTC offsets and DST.
  const target = new Date(`${day}T00:00:00Z`).getTime();
  let instant = target;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const delta = target - local;
    if (!delta) break;
    instant += delta;
  }
  return new Date(instant).toISOString();
}
