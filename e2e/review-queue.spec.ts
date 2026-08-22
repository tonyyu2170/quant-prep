import { expect, test } from "@playwright/test";

// Spec §7 flow 2: answer wrong → problem due in /review → complete a review.
test("a missed problem lands in the review queue and reschedules after a review", async ({ page }) => {
  await page.goto("/drills/probability");
  const input = page.getByLabel("answer");
  await expect(input).toBeVisible();
  await input.fill("99999");
  await input.press("Enter");
  await expect(page.getByTestId("walkthrough")).toBeVisible();
  await expect(page.getByTestId("add-review")).toContainText("In review queue"); // auto-intake on the miss

  await page.goto("/review");
  await expect(page.getByTestId("start-review")).toBeVisible();
  await expect(page.getByText("due now").first()).toBeVisible();

  await page.getByTestId("start-review").click();
  await expect(page.getByText(/review · 1 of 1/)).toBeVisible();
  const reviewInput = page.getByLabel("answer");
  await reviewInput.fill("99999");
  await reviewInput.press("Enter");
  await expect(page.getByTestId("walkthrough")).toBeVisible();
  await page.getByTestId("walkthrough").press("Enter");

  await expect(page.getByText("review complete")).toBeVisible();
  await page.getByRole("button", { name: "Back to the queue" }).click();
  // Graded wrong on review → interval collapses to 1 day, so nothing is due now.
  await expect(page.getByText("tomorrow")).toBeVisible();
  await expect(page.getByTestId("start-review")).toHaveCount(0);
});
