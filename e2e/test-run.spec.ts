import { expect, test } from "@playwright/test";

test("timed sim happy path: answer/skip through, land on results, stats renders", async ({ page }) => {
  await page.goto("/test/optiver-80in8?count=3&seed=42");
  const input = page.getByLabel("answer");
  await expect(input).toBeVisible();
  await expect(page.locator("nav")).toHaveCount(0); // focus mode hides chrome
  for (let i = 0; i < 3; i++) {
    await input.fill("0.5"); // wrong is fine; we're testing flow
    await input.press("Enter");
  }
  await expect(page.getByTestId("score")).toBeVisible();
  await page.goto("/stats");
  await expect(page.getByText("Recent sims")).toBeVisible();
  await expect(page.getByText("optiver-80in8").first()).toBeVisible();
});

test("sequences drill reveals the rule after answering", async ({ page }) => {
  await page.goto("/drills/sequences");
  const input = page.getByLabel("answer");
  await input.fill("999999");
  await input.press("Enter");
  await expect(page.getByText(/ANSWER:|CORRECT/)).toBeVisible();
  await expect(page.getByText("Enter for next")).toBeVisible();
});
