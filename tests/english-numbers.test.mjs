import { test } from "node:test";
import assert from "node:assert/strict";
import { NUMBER_WORDS, numberInEnglish, numberAnswer, parseRange, randomNumber } from "../lib/english-game/numbers.ts";

test("US cardinal numbers cover irregular spellings and boundaries", () => {
  const examples = new Map([
    [0,"zero"],[11,"eleven"],[12,"twelve"],[13,"thirteen"],[15,"fifteen"],[18,"eighteen"],
    [20,"twenty"],[21,"twenty-one"],[40,"forty"],[99,"ninety-nine"],[100,"one hundred"],
    [101,"one hundred one"],[110,"one hundred ten"],[1000,"one thousand"],[1001,"one thousand one"],
    [1010,"one thousand ten"],[999999,"nine hundred ninety-nine thousand nine hundred ninety-nine"],[1000000,"one million"],
  ]);
  for (const [number, english] of examples) assert.equal(numberInEnglish(number),english);
  for (const number of [-1,1.5,1000001,NaN,Infinity]) assert.throws(() => numberInEnglish(number));
});
test("every generated word has both guides, including the largest prompt", () => {
  for (const number of [...Array(1000).keys(),1000,1001,999999,1000000]) {
    const answer = numberAnswer(number);
    assert.ok(answer.ipa.startsWith("/") && answer.ipa.endsWith("/"));
    for (const word of answer.english.split(/[ -]/)) assert.ok(NUMBER_WORDS[word]?.ipa && NUMBER_WORDS[word]?.vietnamese,word);
    assert.ok(answer.vietnamese.length > 0);
  }
  assert.equal(numberAnswer(21).ipa,"/ˈtwɛnti wʌn/");
  assert.equal(numberAnswer(21).english,"twenty-one");
});
test("custom ranges accept inclusive single-number bounds and reject invalid input", () => {
  assert.deepEqual(parseRange("0","1000000"),{min:0,max:1000000});
  assert.deepEqual(parseRange("21","21"),{min:21,max:21});
  for (const [min,max] of [["","100"],["-1","10"],["1.5","20"],["10","2"],["0","1000001"],["1e3","2000"],["NaN","100"],["1,000","2000"]]) assert.throws(() => parseRange(min,max));
});
test("random draws cover both ends without immediately repeating", () => {
  assert.equal(randomNumber({min:0,max:100},undefined,() => 0),0);
  assert.equal(randomNumber({min:0,max:100},undefined,() => .999999),100);
  assert.equal(randomNumber({min:21,max:21},21),21);
  for (const previous of [0,1,2]) {
    const draws = [0,.25,.5,.75,.999999].map(sample => randomNumber({min:0,max:2},previous,() => sample));
    assert.ok(draws.every(number => number >= 0 && number <= 2 && number !== previous));
    assert.equal(new Set(draws).size,2);
  }
  assert.equal(randomNumber({min:5,max:6},99,() => 0),5);
  assert.throws(() => randomNumber({min:10,max:0}));
});
