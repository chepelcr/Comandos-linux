import { test, expect } from '@playwright/test';

test('phone header keeps all actions on one row and menu below', async ({ page, isMobile }) => {
 test.skip(!isMobile, 'Phone navigation sizing.');
 for (const width of [320, 375, 390, 768]) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  const items = page.locator('.header-inner>.brand, .header-tools .language-button, .header-tools .theme-button, .header-tools .account-link, .header-inner>.menu-toggle');
  const bounds = await items.evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { y: rect.y + rect.height / 2, right: rect.right, width: rect.width, height: rect.height }; }));
  expect(Math.max(...bounds.map(item => item.y)) - Math.min(...bounds.map(item => item.y))).toBeLessThan(2);
  expect(Math.max(...bounds.map(item => item.right))).toBeLessThanOrEqual(width);
  for (const item of bounds.slice(1)) { expect(item.width).toBeGreaterThanOrEqual(44); expect(item.height).toBeGreaterThanOrEqual(44); }
  await page.locator('.menu-toggle').click();
  await expect(page.locator('.nav')).toBeVisible();
  const nav = await page.locator('.nav').boundingBox();
  expect(nav!.y).toBeGreaterThan(bounds[0].y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.menu-toggle').click();
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('.nav')).toHaveAttribute('inert','');
  await expect(page.locator('.nav')).toHaveCSS('visibility','hidden');
  expect((await page.locator('.nav').boundingBox())!.height).toBeLessThan(1);
 }
});

test('sign-in, recovery and signup stay inside the course app', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('locale', 'en'));
 await page.goto('/account');
 await expect(page.locator('#signin-email')).toBeVisible();
 await expect(page.locator('#signin-password')).toHaveAttribute('autocomplete', 'current-password');
 await page.getByRole('button', { name: 'Forgot your password?', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Reset password', exact: true })).toBeVisible();
 await expect(page.locator('#signin-password')).toHaveCount(0);
 await page.getByRole('button', { name: 'Back to sign in', exact: true }).click();
 await page.getByRole('button', { name: 'Create account', exact: true }).click();
 await expect(page.locator('#signup-email')).toBeVisible();
 await page.getByRole('button', { name: 'Cancel', exact: true }).click();
 await expect(page.locator('#signin-email')).toBeVisible();
 await expect(page).toHaveURL(/\/account$/);
});


test('mobile lesson footer follows the workspace and scrolls into view', async ({ page, isMobile }) => {
 test.skip(!isMobile, 'Mobile footer flow.');
 await page.goto('/learn/foundations/intro');
 const footer=page.locator('.footer');
 expect((await footer.boundingBox())!.y).toBeGreaterThanOrEqual(page.viewportSize()!.height-1);
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await expect(footer).toBeInViewport();
 expect((await footer.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height);
 expect(await footer.evaluate(el=>getComputedStyle(el).position)).toBe('static');
});
