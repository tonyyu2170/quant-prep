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
  // Phase 1.5A: the sim wrote 3 per-question attempts → per-topic accuracy row appears
  await expect(page.getByText("3q")).toBeVisible();
  // …but the ?count=3 run is non-standard, so the 80-in-8 score chart stays empty
  await expect(page.getByText("No timed sims yet.")).toBeVisible();
  // and the score chart's preset toggle is present
  await expect(page.getByRole("button", { name: "Seq-sprint scores" })).toBeVisible();
});

test("sequences drill reveals the rule after answering", async ({ page }) => {
  await page.goto("/drills/sequences");
  const input = page.getByLabel("answer");
  await input.fill("999999");
  await input.press("Enter");
  await expect(page.getByText(/ANSWER:|CORRECT/)).toBeVisible();
  await expect(page.getByText("Enter for next")).toBeVisible();
});

test("probability drill unfolds a walkthrough and re-rolls", async ({ page }) => {
  await page.goto("/drills/probability");
  const input = page.getByLabel("answer");
  await expect(input).toBeVisible();
  await input.fill("99999");
  await input.press("Enter");
  await expect(page.getByTestId("walkthrough")).toBeVisible();
  await expect(page.getByTestId("verdict")).toContainText("✗");
  await expect(page.getByText("Key insight.")).toBeVisible();
  await expect(page.getByText("Report issue")).toBeVisible();
  await page.getByRole("button", { name: "Re-roll numbers" }).click();
  await expect(page.getByLabel("answer")).toBeVisible();
  await expect(page.getByLabel("answer")).toHaveValue(""); // fresh roll, cleared input
});
