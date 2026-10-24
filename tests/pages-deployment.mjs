import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { chromium, expect } from "@playwright/test";

// Serve the actual export with no Next.js server, matching Pages' static hosting.
const root = resolve("sites/english-game/out");
const basePath = process.env.PAGES_BASE_PATH ?? "/our-love-space";
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".txt": "text/plain", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url,"http://localhost").pathname);
    if (!pathname.startsWith(`${basePath}/`)) throw new Error("Outside site path");
    const relative = pathname.slice(basePath.length);
    const file = resolve(root, `.${relative}${relative.endsWith("/") ? "index.html" : ""}`);
    if (!file.startsWith(root + sep)) throw new Error("Outside export");
    const body = await readFile(file);
    response.writeHead(200,{ "Content-Type": mime[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
let browser;
try {
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : {});
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  for (const viewport of [{width:320,height:844},{width:1440,height:1100}]) {
    const page = await browser.newPage({viewport});
    const errors = [];
    const requests = [];
    page.on("pageerror",error => errors.push(error.message));
    page.on("response",response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on("request",request => requests.push(request.url()));
    for (const route of ["/","/english-game/"]) {
      await page.goto(`${origin}${basePath}${route}`);
      await expect(page.getByRole("heading",{name:"English practice"})).toBeVisible();
      await expect(page.getByRole("link",{name:/Our private space/})).toHaveCount(0);
      const initial = await page.locator("h2").innerText();
      await page.getByRole("button",{name:"Next",exact:true}).click();
      await expect(page.locator("h2")).not.toHaveText(initial);
      for (const mode of ["numbers","ordinals","dates","times"]) {
        await page.getByLabel("Practice",{exact:true}).selectOption(mode);
        await page.getByRole("button",{name:"Show answer",exact:true}).click();
        await expect(page.getByRole("region",{name:"Practice answer"})).toBeVisible();
        assert.ok((await page.getByRole("region",{name:"Practice answer"}).innerText()).length > 10);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const button = await page.getByRole("button",{name:"Next",exact:true}).boundingBox();
        assert.ok(button.height >= 44,"Exported CSS must load");
        await page.getByRole("button",{name:"Next",exact:true}).click();
        await expect(page.getByRole("region",{name:"Practice answer"})).toHaveCount(0);
      }
    }
    await page.screenshot({path:join(tmpdir(),`english-pages-${viewport.width}.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    assert.ok(requests.every(url => url.startsWith(`${origin}${basePath}/`)),"No external or unprefixed requests");
    assert.ok(!requests.some(url => /supabase|\/login|\/adventures/.test(url)),"Static game must stay independent of private routes");
    await page.close();
  }
  console.log("Pages export passed: both routes, all modes, mobile/desktop, prefixed assets, no private requests.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
