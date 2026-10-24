import { test } from "node:test";
import assert from "node:assert/strict";
import { date, tripInput, activityInput, money, sumMoney, currencyCode, departureInstant, revision } from "../lib/adventures/validation.ts";
import { expenseSummary } from "../lib/adventures/expenses.ts";
import { nextAdventure, currentAdventure } from "../lib/adventures/upcoming.ts";
import { photoType } from "../lib/adventures/photos.ts";

const form = values => { const data = new FormData(); for (const [key,value] of Object.entries(values)) data.set(key,String(value)); return data; };
const trip = { title: "Our first escape", destination: "Kyoto", status: "dreaming", timezone: "Asia/Tokyo" };
test("dreaming trips can omit dates; planned trips cannot", () => {
  assert.equal(tripInput(form(trip)).start_date,null);
  assert.throws(() => tripInput(form({ ...trip,status: "upcoming" })));
  assert.throws(() => tripInput(form({ ...trip,status: "memories" })));
});
test("invalid calendar dates and reversed or partial ranges are rejected", () => {
  for (const value of ["2026-02-30","2026-13-01","","2026-1-01"]) assert.throws(() => date(value));
  assert.equal(date("2028-02-29"),"2028-02-29");
  assert.throws(() => tripInput(form({ ...trip,start_date: "2026-12-02",end_date: "2026-12-01" })));
  assert.throws(() => tripInput(form({ ...trip,start_date: "2026-12-02" })));
});
test("trip status, timezone and required text are validated", () => {
  assert.throws(() => tripInput(form({ ...trip,status: "published" })));
  assert.throws(() => tripInput(form({ ...trip,timezone: "Moon/Sea" })));
  assert.throws(() => tripInput(form({ ...trip,title: "  " })));
});
test("money respects zero, two and three fraction digit currencies", () => {
  assert.equal(money("1234","JPY"),"1234");
  assert.throws(() => money("12.5","JPY"));
  assert.equal(money("00012.30","USD"),"12.30");
  assert.equal(money("12.345","KWD"),"12.345");
  for (const value of ["0","-1","Infinity","1e4","2.123","1,000","1000000000000"]) assert.throws(() => money(value,"USD"));
  assert.throws(() => currencyCode("XYZ"));
});
test("currency totals use exact arithmetic including large values", () => {
  assert.equal(sumMoney(["0.1","0.2"],"USD"),"0.30");
  assert.equal(sumMoney(["999999999999.99","0.01"],"USD"),"1000000000000.00");
  assert.equal(sumMoney(["100","250"],"JPY"),"350");
  assert.equal(sumMoney(["0.001","0.002"],"KWD"),"0.003");
});
test("activities require a day, valid time, and currency for a cost", () => {
  const value = { title: "Sunrise",date: "2026-12-01",start_time: "06:30" };
  assert.equal(activityInput(form(value)).start_time,"06:30");
  assert.throws(() => activityInput(form({ ...value,start_time: "24:00" })));
  assert.throws(() => activityInput(form({ ...value,estimated_cost: "10" })));
});
test("countdown uses midnight at destination across offsets and DST", () => {
  assert.equal(departureInstant("2026-12-01","Asia/Tokyo"),"2026-11-30T15:00:00.000Z");
  assert.equal(departureInstant("2026-07-01","Europe/Paris"),"2026-06-30T22:00:00.000Z");
  assert.equal(departureInstant("2026-12-01","Asia/Kathmandu"),"2026-11-30T18:15:00.000Z");
});
test("revisions reject invalid and unsafe values", () => {
  assert.equal(revision(form({ revision: "0" })),0);
  for (const value of ["-1","NaN","1.5","999999999999999999"]) assert.throws(() => revision(form({revision:value})));
});
test("expenses stay separated by currency, category and payer", () => {
  const rows = [
    { currency: "USD",amount: "0.1",category: "food",paid_by: "a" },
    { currency: "USD",amount: "0.2",category: "food",paid_by: "b" },
    { currency: "JPY",amount: "1000",category: "transport",paid_by: "a" },
  ];
  const summaries = expenseSummary(rows);
  assert.deepEqual(summaries.map(row => [row.currency,row.total]),[["JPY","1000"],["USD","0.30"]]);
  assert.deepEqual(summaries[1].payers,[{ id: "a",total: "0.10" },{ id: "b",total: "0.20" }]);
  assert.deepEqual(summaries[1].categories,[{ label: "food",total: "0.30" }]);
});
test("next trip excludes undated dreams, completed and already departed trips", () => {
  const base = { start_date: "2026-12-01",end_date: "2026-12-02",timezone: "Asia/Tokyo",status: "upcoming" };
  const rows = [ { ...base,id: "late",start_date: "2026-12-05",end_date: "2026-12-06" },{ ...base,id: "next" },{ ...base,id: "dream",status: "dreaming" },{ ...base,id: "past",start_date: "2026-01-01" } ];
  assert.equal(nextAdventure(rows,new Date("2026-11-01T00:00:00Z")).id,"next");
  assert.equal(currentAdventure(rows,new Date("2026-12-02T10:00:00Z")).id,"next");
  assert.equal(currentAdventure(rows,new Date("2026-12-03T00:00:00Z")),null);
  assert.equal(nextAdventure([],new Date()),null);
});
test("image signatures reject renamed files", () => {
  assert.equal(photoType(new TextEncoder().encode("<svg>not a jpeg</svg>")),null);
  assert.equal(photoType(new Uint8Array([255,216,255,0])),"image/jpeg");
  assert.equal(photoType(new Uint8Array([137,80,78,71,13,10,26,10])),"image/png");
  assert.equal(photoType(new TextEncoder().encode("RIFF1234WEBP")),"image/webp");
});
