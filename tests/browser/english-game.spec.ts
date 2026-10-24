import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    englishGameTest: {
      spoken: { text: string; rate: number }[];
      utterances: SpeechSynthesisUtterance[];
      canceled: number;
      streams: MediaStream[];
      revoked: string[];
      deny: boolean;
      delay: boolean;
      completePermission?: () => void;
      voicesReady: boolean;
    };
  }
}

// These flags provide a synthetic microphone. The tests never record the user's mic.
test.use({ launchOptions: {
  ...(process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : {}),
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
} });

test.beforeEach(async ({ page, request }) => {
  await request.post("http://127.0.0.1:55439/__reset");
  await page.addInitScript(() => {
    const data: Window["englishGameTest"] = { spoken: [], utterances: [], canceled: 0, streams: [], revoked: [], deny: false, delay: false, voicesReady: true };
    window.englishGameTest = data;
    const events = new EventTarget();
    Object.defineProperty(window,"speechSynthesis",{ configurable: true, value: {
      getVoices: () => data.voicesReady ? [{ lang:"en-US",localService:true,name:"Test US voice" }] : [],
      addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
      cancel: () => { data.canceled++; },
      speak: (utterance: SpeechSynthesisUtterance) => { data.utterances.push(utterance); data.spoken.push({ text: utterance.text,rate: utterance.rate }); },
    } });
    Object.defineProperty(window,"SpeechSynthesisUtterance",{ configurable:true,value: class {
      text: string; constructor(text: string) { this.text = text; }
    } });
    const getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      if (data.deny) throw new DOMException("Test denial","NotAllowedError");
      const stream = await getMedia(constraints);
      data.streams.push(stream);
      if (data.delay) await new Promise<void>(resolve => { data.completePermission = resolve; });
      return stream;
    };
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => { data.revoked.push(url); revoke(url); };
  });
});

async function chooseNumber(page: import("@playwright/test").Page, number: number) {
  await page.getByLabel("Range").selectOption("custom");
  await page.getByLabel("From",{ exact:true }).fill(String(number));
  await page.getByLabel("To",{ exact:true }).fill(String(number));
  await page.getByRole("button",{name:"Use this range"}).click();
}

test("public game bypasses Auth even with a signed-in session",async ({ page, request }) => {
  await page.goto("/english-game");
  await expect(page.getByRole("heading",{name:"English practice"})).toBeVisible();
  expect((await (await request.get("http://127.0.0.1:55439/__auth-requests")).json()).count).toBe(0);
  await page.goto("/login");
  await expect(page.getByRole("link",{name:/Practice English numbers/})).toBeVisible();
  await page.getByLabel("Email",{exact:true}).fill("partner@example.test");
  await page.getByLabel("Password",{exact:true}).fill("fixture-password");
  await page.getByRole("button",{name:"Come inside"}).click();
  await expect(page).toHaveURL(/\/adventures$/);
  // Leave the private shell and its prefetches before measuring public-page traffic.
  await page.goto("/login");
  await expect(page.getByRole("link",{name:/Practice English numbers/})).toBeVisible();
  await request.delete("http://127.0.0.1:55439/__auth-requests");
  await page.goto("/english-game");
  await expect(page.getByRole("heading",{name:"English practice"})).toBeVisible();
  expect((await (await request.get("http://127.0.0.1:55439/__auth-requests")).json()).count).toBe(0);
});

test("ranges, reveal, American speech and small layouts stay consistent",async ({ page }) => {
  await page.goto("/english-game");
  await expect(page.getByRole("region",{name:"Practice answer"})).toHaveCount(0);
  await chooseNumber(page,21);
  await page.getByRole("button",{name:"Show answer",exact:true}).click();
  await expect(page.getByRole("region",{name:"Practice answer"})).toContainText("twenty-one");
  await expect(page.getByRole("region",{name:"Practice answer"})).toContainText("/ˈtwɛnti wʌn/");
  await expect(page.getByText("TWEN-ti · oăn",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop audio",exact:true})).toBeVisible();
  await page.getByLabel("Slow audio",{exact:true}).check();
  await expect(page.getByRole("button",{name:"Stop audio",exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.englishGameTest.spoken)).toEqual([{text:"twenty-one",rate:1},{text:"twenty-one",rate:.5}]);
  await page.getByRole("button",{name:"Stop audio",exact:true}).click();
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await page.getByRole("button",{name:"Stop audio",exact:true}).click();
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeVisible();
  expect(await page.evaluate(() => window.englishGameTest.spoken)).toEqual([{text:"twenty-one",rate:1},{text:"twenty-one",rate:.5},{text:"twenty-one",rate:.5}]);
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(page.getByRole("region",{name:"Practice answer"})).toHaveCount(0);
  await page.getByLabel("From",{exact:true}).fill("50");
  await page.getByLabel("To",{exact:true}).fill("10");
  await page.getByRole("button",{name:"Use this range"}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("minimum no greater");
  await expect(page.getByLabel("Range").locator("option:checked")).toHaveText("Custom · 21–21");
  await expect(page.getByRole("heading",{name:"Number to pronounce: 21"})).toBeVisible();
  await chooseNumber(page,1000000);
  await page.getByRole("button",{name:"Show answer",exact:true}).click();
  await expect(page.getByRole("region",{name:"Practice answer"})).toContainText("one million");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:`/private/tmp/english-game-${test.info().project.name}.png`,fullPage:true});
});

test("real browser recording can replay and is discarded on the next round",async ({ page }) => {
  await page.goto("/english-game");
  expect(await page.evaluate(() => window.englishGameTest.streams.length)).toBe(0);
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop recording",exact:true})).toBeVisible();
  await expect(page.getByLabel("1 seconds recorded",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeDisabled();
  await page.getByRole("button",{name:"Stop recording",exact:true}).click();
  await expect(page.getByLabel("Your recording",{exact:true})).toBeVisible();
  expect(await page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  await expect.poll(() => page.locator("audio").evaluate(audio => (audio as HTMLAudioElement).readyState)).toBeGreaterThan(0);
  await page.getByLabel("Your recording",{exact:true}).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => page.locator("audio").evaluate(audio => (audio as HTMLAudioElement).paused)).toBe(false);
  await page.keyboard.press("Space");
  await expect(page.getByText("This recording couldn’t play.",{exact:false})).toHaveCount(0);
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await expect(page.locator("audio")).toHaveCount(0);
  expect(await page.evaluate(() => window.englishGameTest.revoked.length)).toBeGreaterThan(0);
});

test("denied or unsupported recording keeps the written game usable",async ({ page }) => {
  await page.goto("/english-game");
  await page.evaluate(() => { window.englishGameTest.deny = true; });
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect(page.getByText(/Microphone permission was denied/)).toBeVisible();
  await page.getByRole("button",{name:"Show answer",exact:true}).click();
  await expect(page.getByRole("region",{name:"Practice answer"})).toBeVisible();
  await page.evaluate(() => { Object.defineProperty(window,"MediaRecorder",{configurable:true,value:undefined}); });
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect(page.getByText(/This browser can’t record audio/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeEnabled();
});

test("late microphone grants cannot capture the next round",async ({ page }) => {
  await page.goto("/english-game");
  await page.evaluate(() => { window.englishGameTest.delay = true; });
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.englishGameTest.completePermission))).toBe(true);
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await page.evaluate(() => window.englishGameTest.completePermission?.());
  await expect.poll(() => page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  await expect(page.getByRole("button",{name:"Record my voice",exact:true})).toBeVisible();
});

test("voice loading and missing American voices have a usable fallback",async ({ page }) => {
  await page.addInitScript(() => { window.englishGameTest.voicesReady = false; });
  await page.goto("/english-game");
  await expect(page.getByText(/No American English voice is available/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeDisabled();
  await page.evaluate(() => { window.englishGameTest.voicesReady = true; window.speechSynthesis.dispatchEvent(new Event("voiceschanged")); });
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Show answer",exact:true}).click();
  await expect(page.getByRole("region",{name:"Practice answer"})).toBeVisible();
});

test("active capture stops on round changes, range changes and route exit",async ({ page }) => {
  await page.goto("/english-game");
  await page.getByLabel("Practice",{exact:true}).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Slow audio",{exact:true})).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Range",{exact:true})).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button",{name:"Record my voice",exact:true})).toBeFocused();
  expect(await page.getByRole("button",{name:"Record my voice",exact:true}).evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
  for (const action of ["round","range","route"]) {
    await page.getByRole("button",{name:"Record my voice",exact:true}).click();
    await expect(page.getByRole("button",{name:"Stop recording",exact:true})).toBeVisible();
    if (action === "round") await page.getByRole("button",{name:"Next",exact:true}).click();
    if (action === "range") await page.getByLabel("Range").selectOption("hundreds");
    if (action === "route") await page.getByRole("link",{name:"Our private space"}).click();
    await expect.poll(() => page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  }
  await expect(page).toHaveURL(/\/login$/);
});

test("recording automatically releases the microphone at thirty seconds",async ({ page }) => {
  await page.clock.install();
  await page.goto("/english-game");
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop recording",exact:true})).toBeVisible();
  await page.clock.fastForward(30_000);
  await expect(page.getByRole("button",{name:"Stop recording",exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
});

test("compact controls fit the first mobile viewport and help stays optional",async ({ page }) => {
  const originalViewport = page.viewportSize()!;
  await page.goto("/english-game");
  await page.screenshot({path:`/private/tmp/english-game-compact-${test.info().project.name}.png`,scale:"css",animations:"disabled"});
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    // Allow the compositor to finish resizing before capturing a mobile viewport.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("heading",{name:"English practice"})).toBeVisible();
    for (const name of ["Record my voice","Listen","Show answer","Next"]) {
      const control = page.getByRole("button",{name,exact:true});
      await expect(control).toBeVisible();
      const box = (await control.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeLessThanOrEqual(48);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator("details")).toHaveJSProperty("open",false);
    await page.screenshot({path:`/private/tmp/english-game-compact-${test.info().project.name}-${width}.png`,scale:"css",animations:"disabled"});
  }
  await page.setViewportSize(originalViewport);
  await page.locator("summary").filter({hasText:/^Help$/}).click();
  await expect(page.getByText(/Microphone access needs HTTPS or localhost/)).toBeVisible();
  await expect(page.getByText(/Custom ranges accept whole numbers/)).toBeVisible();
});

test("all practice modes reveal and speak the matching answer in compact layouts",async ({ page }) => {
  await page.goto("/english-game");
  const originalViewport = page.viewportSize()!;
  await page.setViewportSize({width:320,height:844});
  for (const mode of ["ordinals","dates","times"]) {
    await page.getByLabel("Practice",{exact:true}).selectOption(mode);
    await expect(page.getByRole("region",{name:"Practice answer"})).toHaveCount(0);
    if (mode === "ordinals") {
      await chooseNumber(page,21);
      await expect(page.getByRole("heading",{name:"Ordinal to pronounce: 21st"})).toBeVisible();
      await page.getByLabel("From",{exact:true}).fill("0");
      await page.getByRole("button",{name:"Use this range"}).click();
      await expect(page.locator("form").getByRole("alert")).toContainText("Ordinal ranges start at 1");
    } else await expect(page.getByLabel("Range",{exact:true})).toHaveCount(0);
    await page.getByRole("button",{name:"Show answer",exact:true}).click();
    const answer = await page.getByRole("region",{name:"Practice answer"}).locator("dd").first().innerText();
    if (mode === "ordinals") expect(answer).toBe("twenty-first");
    await page.getByRole("button",{name:"Listen",exact:true}).click();
    expect(await page.evaluate(() => window.englishGameTest.spoken.at(-1)?.text)).toBe(answer);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`/private/tmp/english-${mode}-${test.info().project.name}.png`,scale:"css",animations:"disabled",fullPage:true});
    for (const viewport of [{width:390,height:844},originalViewport]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path:`/private/tmp/english-${mode}-${test.info().project.name}-${viewport.width}.png`,scale:"css",animations:"disabled",fullPage:true});
    }
    await page.setViewportSize({width:320,height:844});
    const prompt = await page.locator("h2").innerText();
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.getByRole("region",{name:"Practice answer"})).toHaveCount(0);
    if (mode !== "ordinals") await expect(page.locator("h2")).not.toHaveText(prompt);
  }
});

test("mode changes release capture, revoke clips and ignore late microphone grants",async ({ page }) => {
  await page.goto("/english-game");
  for (const mode of ["ordinals","dates","times"]) {
    await page.getByRole("button",{name:"Record my voice",exact:true}).click();
    await expect(page.getByRole("button",{name:"Stop recording",exact:true})).toBeVisible();
    await page.getByLabel("Practice",{exact:true}).selectOption(mode);
    await expect.poll(() => page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
    await expect(page.locator("audio")).toHaveCount(0);
  }
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect(page.getByLabel("1 seconds recorded",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Stop recording",exact:true}).click();
  await expect(page.locator("audio")).toBeVisible();
  await page.getByLabel("Practice",{exact:true}).selectOption("numbers");
  await expect(page.locator("audio")).toHaveCount(0);
  expect(await page.evaluate(() => window.englishGameTest.revoked.length)).toBeGreaterThan(0);
  await page.evaluate(() => { window.englishGameTest.delay = true; });
  await page.getByRole("button",{name:"Record my voice",exact:true}).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.englishGameTest.completePermission))).toBe(true);
  await page.getByLabel("Practice",{exact:true}).selectOption("dates");
  await page.evaluate(() => window.englishGameTest.completePermission?.());
  await expect.poll(() => page.evaluate(() => window.englishGameTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
});


test("slow answers restart immediately, restore normal speed and survive stale voice callbacks",async ({ page }) => {
  await page.goto("/english-game");
  await chooseNumber(page,21);
  await page.getByLabel("Slow audio",{exact:true}).check();
  expect(await page.evaluate(() => window.englishGameTest.spoken)).toEqual([]);
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  expect(await page.evaluate(() => window.englishGameTest.spoken.at(-1))).toEqual({text:"twenty-one",rate:.5});
  await page.getByLabel("Slow audio",{exact:true}).uncheck();
  expect(await page.evaluate(() => window.englishGameTest.spoken.at(-1))).toEqual({text:"twenty-one",rate:1});
  // A canceled slow utterance must not mark its replacement as finished or failed.
  await page.evaluate(() => {
    const old = window.englishGameTest.utterances[0];
    old.onend?.(new Event("end") as SpeechSynthesisEvent);
    old.onerror?.(Object.assign(new Event("error"),{error:"interrupted"}) as SpeechSynthesisErrorEvent);
  });
  await expect(page.getByRole("button",{name:"Stop audio",exact:true})).toBeVisible();
  for (const mode of ["numbers","ordinals","dates","times"]) {
    await page.getByLabel("Practice",{exact:true}).selectOption(mode);
    await page.getByLabel("Slow audio",{exact:true}).check();
    await page.getByRole("button",{name:"Show answer",exact:true}).click();
    const answer = await page.getByRole("region",{name:"Practice answer"}).locator("dd").first().innerText();
    await page.getByRole("button",{name:"Listen",exact:true}).click();
    expect(await page.evaluate(() => window.englishGameTest.spoken.at(-1))).toEqual({text:answer,rate:.5});
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeVisible();
  }
});
