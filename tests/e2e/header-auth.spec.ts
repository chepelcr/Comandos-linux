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

test('focused auth pages use clean routes and stay outside course navigation', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('locale', 'en'));
 await page.goto('/login');
 await expect(page.locator('#signin-email')).toBeVisible();
 await expect(page.locator('.nav')).toHaveCount(0);
 await expect(page.locator('.auth-footer')).toBeVisible();
 await expect(page.locator('#signin-password')).toHaveAttribute('autocomplete', 'current-password');
 await page.getByRole('link', { name: 'Forgot your password?', exact: true }).click();
 await expect(page).toHaveURL(/\/forgot-password$/);
 await expect(page.getByRole('heading', { name: 'Reset password', exact: true })).toBeVisible();
 await expect(page.locator('#signin-password')).toHaveCount(0);
 await page.getByRole('link', { name: 'Back to sign in', exact: true }).click();
 await page.getByRole('link', { name: 'Create account', exact: true }).click();
 await expect(page).toHaveURL(/\/register$/);
 await expect(page.locator('#signup-email')).toBeVisible();
 await expect(page.locator('.motion-veil')).toHaveCount(0);
 await expect(page.locator('#main')).not.toHaveAttribute('inert','');
 await page.locator('#signup-name').fill('Test Student');
 await page.locator('#signup-email').fill('registration-check@example.invalid');
 await page.locator('#signup-username').fill('test_student');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.locator('#signup-password').fill('LongPassword9!');
 await expect(page.getByText('Meets all requirements', {exact:true})).toBeVisible();
 await expect(page.locator('#confirm-password')).toBeVisible();
 await page.locator('#confirm-password').fill('LongPassword9!');
 await page.locator('[aria-label="Show password"]').first().click();
 await expect(page.locator('#signup-password')).toHaveAttribute('type','text');
 await expect(page.locator('#confirm-password')).toHaveAttribute('type','password');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const policies=page.locator('.registration-policies input[type=checkbox]');
 await expect(policies).toHaveCount(2);
 await expect(policies.first()).not.toBeChecked();
 expect(await page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity())).toBe(false);
 await policies.first().check();
 expect(await page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity())).toBe(false);
 await policies.last().check();
 expect(await page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity())).toBe(true);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('guest support redirects to focused login and is absent from navigation',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('locale','en'));
 await page.goto('/courses');
 await expect(page.locator('.nav a[href="/support"]')).toHaveCount(0);
 await page.goto('/support');
 await expect(page).toHaveURL(/\/login$/);
 await expect(page.locator('#signin-email')).toBeVisible();
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

test('registration creates an account only after details, matching passwords and both policies, then verifies email',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('locale','en'));
 const signups:Record<string,unknown>[]=[];
 await page.route('https://cognito-idp.us-east-1.amazonaws.com/**',async route=>{
  const action=route.request().headers()['x-amz-target']?.split('.').at(-1);
  if(action==='SignUp'){
   signups.push(route.request().postDataJSON());
   await route.fulfill({contentType:'application/x-amz-json-1.1',body:JSON.stringify({UserConfirmed:false,UserSub:'00000000-0000-4000-8000-000000000001',CodeDeliveryDetails:{Destination:'s***@example.invalid',DeliveryMedium:'EMAIL',AttributeName:'email'}})});
  }else if(action==='ConfirmSignUp')await route.fulfill({contentType:'application/x-amz-json-1.1',body:'{}'});
  else await route.continue();
 });
 await page.goto('/register');
 await expect(page.locator('.registration-steps [aria-current=step]')).toContainText('Profile');
 await expect(page.locator('#signup-password')).toHaveCount(0);
 await page.locator('#signup-name').fill('Test Student');await page.locator('#signup-email').fill('student@example.invalid');await page.locator('#signup-username').fill('test_student');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.locator('.registration-steps [aria-current=step]')).toContainText('Password');
 await page.locator('#signup-password').fill('LongPassword9!');await page.locator('#confirm-password').fill('DifferentPassword9!');await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.locator('[role=alert]')).toContainText(/passwords do not match/i);expect(signups).toHaveLength(0);
 await page.locator('#confirm-password').fill('LongPassword9!');await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.locator('.registration-steps [aria-current=step]')).toContainText('Policies');
 await page.getByRole('button',{name:'Create account',exact:true}).click();expect(signups).toHaveLength(0);
 for(const checkbox of await page.locator('.registration-policies input[type=checkbox]').all())await checkbox.check();
 await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(/\/verify-email$/);
 expect(signups).toHaveLength(1);expect(signups[0].UserAttributes).toEqual(expect.arrayContaining([{Name:'name',Value:'Test Student'},{Name:'email',Value:'student@example.invalid'},{Name:'preferred_username',Value:'test_student'}]));
 await expect(page.locator('.registration-steps [aria-current=step]')).toContainText('Verify');await expect(page.locator('.motion-veil')).toHaveCount(0);await expect(page.locator('#main')).not.toHaveAttribute('inert','');await page.locator('#signin-code').fill('123456');await page.locator('form button.button').click();
 await expect(page).toHaveURL(/\/login$/);
});
