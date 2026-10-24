import { test, expect } from "@playwright/test";

const id = "10000000-0000-0000-0000-000000000001";
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email",{ exact: true }).fill("partner@example.test");
  await page.getByLabel("Password",{ exact: true }).fill("fixture-password");
  await page.getByRole("button",{ name: "Come inside" }).click();
  await expect(page).toHaveURL(/\/adventures$/);
}
test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:55439/__reset"); });

test("private routes redirect to sign in",async ({ page }) => {
  await page.goto(`/adventures/${id}/expenses`);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email",{ exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password",{ exact: true })).toBeFocused();
  expect(await page.getByLabel("Password",{ exact: true }).evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
});
test("failed sign-in explains credentials and email confirmation errors",async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email",{ exact: true }).fill("partner@example.test");
  await page.getByLabel("Password",{ exact: true }).fill("wrong-password");
  await page.getByRole("button",{ name: "Come inside" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("The email or password is incorrect. Please try again.");
  await page.getByLabel("Email",{ exact: true }).fill("unconfirmed@example.test");
  await page.getByLabel("Password",{ exact: true }).fill("fixture-password");
  await page.getByRole("button",{ name: "Come inside" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Your email hasn’t been confirmed yet. Confirm it before signing in.");
  await page.getByLabel("Email",{ exact: true }).fill("partner@example.test");
  await page.getByLabel("Password",{ exact: true }).fill("fixture-password");
  await page.getByRole("button",{ name: "Come inside" }).click();
  await expect(page).toHaveURL(/\/adventures$/);
});
test("adventures has mobile and desktop layouts, navigation, countdown and empty states",async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading",{ name: /Somewhere new/ })).toBeVisible();
  await expect(page.getByLabel("Countdown to departure")).toBeVisible();
  await expect(page.getByText("Where would you like to wake up together?",{ exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/adventures-${test.info().project.name}.png`,fullPage: true });
  await page.goto(`/adventures/${id}/itinerary`);
  await expect(page.getByRole("link",{ name: "Itinerary",exact: true })).toHaveAttribute("aria-current","page");
  await expect(page.getByText("Our days are still a blank page.",{ exact: false })).toBeVisible();
});
test("both trip form and itinerary preserve saved changes",async ({ page }) => {
  await login(page);
  await page.getByRole("link",{ name: "Dream up a trip" }).click();
  await page.getByLabel("Give this adventure a name").fill("A mountain weekend");
  await page.getByLabel("Where are we going?").fill("Test mountains");
  await page.getByLabel("Destination timezone").fill("Asia/Tokyo");
  await page.getByRole("button",{ name: "Start our adventure" }).click();
  await expect(page.getByRole("heading",{ name: "A mountain weekend",exact: true })).toBeVisible();
  await page.getByRole("link",{ name: "Edit our trip",exact: true }).click();
  await page.getByLabel("Give this adventure a name").fill("Our mountain weekend");
  await page.getByRole("button",{ name: "Save our trip" }).click();
  await expect(page.getByRole("heading",{ name: "Our mountain weekend",exact: true })).toBeVisible();
  await page.getByRole("link",{ name: "Itinerary",exact: true }).click();
  await page.getByLabel("What shall we do?").fill("A slow sunrise walk");
  await page.getByLabel("Day",{ exact: true }).fill("2026-12-01");
  await page.getByRole("button",{ name: "Add to our day" }).click();
  await expect(page.getByRole("heading",{ name: "A slow sunrise walk",exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading",{ name: "A slow sunrise walk",exact: true })).toBeVisible();
  await page.getByRole("link",{ name: "Overview",exact: true }).click();
  await page.locator("summary").filter({ hasText: /^Remove this adventure$/ }).click();
  page.once("dialog",dialog => dialog.accept());
  await page.getByRole("button",{ name: "Delete trip",exact: true }).click();
  await expect(page).toHaveURL(/\/adventures$/);
  await expect(page.getByRole("heading",{ name: "Our mountain weekend",exact: true })).toHaveCount(0);
});
test("wish conversion reaches the itinerary",async ({ page }) => {
  await login(page);
  await page.getByLabel("Something we want to experience").fill("Share a seaside breakfast");
  await page.getByRole("button",{ name: "Keep this little dream" }).click();
  await expect(page.getByRole("heading",{ name: "Share a seaside breakfast",exact: true })).toBeVisible();
  await page.getByText("Make a plan for this",{ exact: true }).click();
  await page.getByLabel("Choose an adventure").selectOption(id);
  await page.getByLabel("Which day?").fill("2026-12-01");
  await page.getByRole("button",{ name: "Add to our itinerary" }).click();
  await expect(page).toHaveURL(new RegExp(`/adventures/${id}/itinerary$`));
  await expect(page.getByRole("heading",{ name: "Share a seaside breakfast",exact: true })).toBeVisible();
});
test("expenses keep currencies separate and memories accept photos",async ({ page }) => {
  await login(page);
  await page.goto(`/adventures/${id}/expenses`);
  for (const [description,amount,currency] of [["Lunch","12.30","USD"],["Train","1000","JPY"]]) {
    const form = page.locator("form").filter({ has: page.getByRole("button",{ name: "Add expense",exact: true }) });
    await form.getByLabel("What was it for?").fill(description);
    await form.getByLabel("Amount",{ exact: true }).fill(amount);
    await form.getByLabel("Currency code",{ exact: true }).fill(currency);
    await form.getByLabel("Who paid?").selectOption("00000000-0000-0000-0000-000000000001");
    await form.getByLabel("Day",{ exact: true }).fill("2026-12-01");
    await form.getByRole("button",{ name: "Add expense",exact: true }).click();
    await expect(page.getByRole("heading",{ name: description,exact: true })).toBeVisible();
  }
  await expect(page.getByText("Total recorded in USD",{ exact: true })).toBeVisible();
  await expect(page.getByText("Total recorded in JPY",{ exact: true })).toBeVisible();
  await page.goto(`/adventures/${id}/memories`);
  await page.getByLabel("A moment we want to keep").fill("Our quiet morning by the water.");
  await page.getByLabel("Day",{ exact: true }).fill("2026-12-01");
  await page.getByRole("button",{ name: "Keep this moment" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "Our quiet morning by the water." })).toBeVisible();
  await page.locator("summary").filter({ hasText: /^Add photos$/ }).click();
  await page.getByLabel("Add photos to this memory").setInputFiles({ name: "test.png",mimeType: "image/png",buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1cAAAAASUVORK5CYII=","base64") });
  await page.getByRole("button",{ name: "Add photos",exact: true }).click();
  await expect(page.getByText("Photo saved.",{ exact: true })).toBeVisible();
  await expect(page.getByRole("img",{ name: /photo 1$/ })).toBeVisible();
});
