import { test } from "node:test";
import assert from "node:assert/strict";
import { DATE_COUNT, ordinalInEnglish, ordinalLabel, practiceContent, nextPrompt } from "../lib/english-game/practice.ts";
const dateValue = (year, month, day) => (Date.UTC(year, month - 1, day) - Date.UTC(2000, 0, 1)) / 86400000;

test("ordinals handle irregular endings, compounds, suffixes and bounds", () => {
  for (const [value, english, label] of [
    [1,"first","1st"],[2,"second","2nd"],[3,"third","3rd"],[5,"fifth","5th"],[8,"eighth","8th"],
    [9,"ninth","9th"],[11,"eleventh","11th"],[12,"twelfth","12th"],[13,"thirteenth","13th"],
    [20,"twentieth","20th"],[21,"twenty-first","21st"],[30,"thirtieth","30th"],[40,"fortieth","40th"],
    [100,"one hundredth","100th"],[101,"one hundred first","101st"],[111,"one hundred eleventh","111th"],
    [1000,"one thousandth","1,000th"],[1001,"one thousand first","1,001st"],
    [1000000,"one millionth","1,000,000th"],
  ]) {
    assert.equal(ordinalInEnglish(value),english);
    assert.equal(ordinalLabel(value),label);
  }
  for (const value of [0,-1,1.5,1000001,NaN]) assert.throws(() => ordinalInEnglish(value));
  assert.throws(() => nextPrompt("ordinals",{min:0,max:100}));
});
test("calendar dates include leap days, month boundaries and consistent year readings", () => {
  const content = (y,m,d) => practiceContent({mode:"dates",value:dateValue(y,m,d)});
  assert.equal(content(2000,1,1).english,"January first, two thousand");
  assert.equal(content(2009,12,31).english,"December thirty-first, two thousand nine");
  assert.equal(content(2010,1,1).english,"January first, twenty ten");
  assert.equal(content(2026,10,24).english,"October twenty-fourth, twenty twenty-six");
  assert.equal(content(2026,10,24).display,"Oct 24, 2026");
  assert.equal(content(2000,2,29).display,"Feb 29, 2000");
  assert.equal(practiceContent({mode:"dates",value:dateValue(2000,2,29)+1}).display,"Mar 1, 2000");
  assert.equal(practiceContent({mode:"dates",value:dateValue(2001,2,28)+1}).display,"Mar 1, 2001");
  assert.equal(practiceContent({mode:"dates",value:DATE_COUNT-1}).display,"Dec 31, 2099");
  for (const value of [-1,DATE_COUNT,1.5]) assert.throws(() => practiceContent({mode:"dates",value}));
});
test("times distinguish AM and PM, midnight, noon and leading zero minutes", () => {
  for (const [value,display,english] of [
    [0,"12:00 AM","twelve o'clock a.m."],[5,"12:05 AM","twelve oh five a.m."],
    [60,"1:00 AM","one o'clock a.m."],[720,"12:00 PM","twelve o'clock p.m."],
    [1145,"7:05 PM","seven oh five p.m."],[1170,"7:30 PM","seven thirty p.m."],
    [1439,"11:59 PM","eleven fifty-nine p.m."],
  ]) {
    const content = practiceContent({mode:"times",value});
    assert.equal(content.display,display);
    assert.equal(content.english,english);
  }
  for (const value of [-1,1440,1.5]) assert.throws(() => practiceContent({mode:"times",value}));
});
test("every date, minute and ordinal vocabulary combination has complete pronunciation guides", () => {
  for (const [mode, values] of [
    ["dates",Array.from({length:DATE_COUNT},(_,i) => i)],
    ["times",Array.from({length:1440},(_,i) => i)],
    ["ordinals",[...Array.from({length:9999},(_,i) => i+1),999999,1000000]],
  ]) for (const value of values) {
    const content = practiceContent({mode,value});
    assert.ok(content.ipa.length > 2 && content.vietnamese.length > 0);
    assert.ok(!/undefined/.test(content.ipa + content.vietnamese));
  }
});
test("generation covers both bounds and avoids immediate repeats in each mode", () => {
  for (const [mode,range,max] of [["numbers",{min:0,max:100},100],["ordinals",{min:1,max:100},100],["dates",{min:0,max:100},DATE_COUNT-1],["times",{min:0,max:100},1439]]) {
    const first = nextPrompt(mode,range,undefined,() => 0);
    assert.equal(first.value,mode === "ordinals" ? 1 : 0);
    assert.equal(nextPrompt(mode,range,undefined,() => .999999).value,max);
    assert.notEqual(nextPrompt(mode,range,first,() => 0).value,first.value);
  }
  assert.equal(nextPrompt("ordinals",{min:21,max:21},{mode:"ordinals",value:21}).value,21);
});
