const { test: base, expect } = require('@playwright/test');
const { createTestServer } = require('../helpers/server');

const test = base.extend({
  app: [async ({}, use) => {
    const app = await createTestServer();
    try { await use(app); } finally { await app.close(); }
  }, { scope: 'worker' }]
});

test.beforeEach(async ({ page }) => {
  // External fonts and avatars are optional; exercise the real local API.
  await page.route('https://**/*', (route) => route.abort());
});

test('public routes render and private routes redirect guests', async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.getByRole('heading', { name: 'Developer Connector' })).toBeVisible();
  await page.goto(`${app.url}/profiles`);
  await expect(page.getByRole('heading', { name: 'Developers', exact: true })).toBeVisible();
  await page.goto(`${app.url}/dashboard`);
  await expect(page).toHaveURL(`${app.url}/login`);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

test('React, Redux and routing support registration, profiles, posts and login', async ({ page, app }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = 'browser-test@example.invalid';
  const password = 'browser-test-password-123';
  await page.goto(`${app.url}/register`);
  await page.getByPlaceholder('Name', { exact: true }).fill('Browser Test');
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.getByPlaceholder('Confirm Password').fill(password);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByText('Welcome Browser Test')).toBeVisible();
  await page.getByRole('link', { name: 'Create Profile' }).click();
  await page.locator('select[name="status"]').selectOption('Developer');
  await page.locator('input[name="skills"]').fill('JavaScript,React');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByRole('link', { name: 'Edit Profile' })).toBeVisible();

  await page.getByRole('link', { name: 'Posts', exact: true }).click();
  await page.getByPlaceholder('Create a post').fill('Browser dependency upgrade');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('Browser dependency upgrade', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Discussion' }).click();
  await page.getByPlaceholder('Comment the post').fill('Browser comment');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByText('Browser comment', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Browser comment', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Logout' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByText('Welcome Browser Test')).toBeVisible();
  expect(errors).toEqual([]);
});
