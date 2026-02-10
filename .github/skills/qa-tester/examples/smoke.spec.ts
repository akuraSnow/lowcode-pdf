import { test, expect } from '@playwright/test';

test('smoke: main page loads and nav works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('role=link[name="Home"]')).toBeVisible();
});
