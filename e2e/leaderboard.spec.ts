import { expect, test } from "@playwright/test";

// Deliberately state-agnostic: the board renders before and after 0003 is applied, so this
// asserts the shell and the switcher rather than any row content the migration would change.
test("leaderboard renders its shell and preset switcher", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(page.getByText("leaderboard · all-time best per player")).toBeVisible();
  await expect(page.getByRole("button", { name: "Optiver-style 80 in 8" })).toBeVisible();
  const seq = page.getByRole("button", { name: "Sequences Sprint (20 in 8)" });
  await expect(seq).toBeVisible();
  await seq.click();
  await expect(page.getByText("loading…")).toHaveCount(0, { timeout: 10000 }); // settles into some state
});

test("command bar links to the board", async ({ page }) => {
  await page.goto("/drills/arithmetic");
  await page.getByRole("link", { name: "Board" }).click();
  await expect(page).toHaveURL(/\/leaderboard$/);
});
