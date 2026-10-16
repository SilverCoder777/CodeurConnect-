const { test: base, expect } = require('@playwright/test');
const { createTestServer } = require('../helpers/server');

const test = base.extend({
  app: [async ({}, use) => {
    const app = await createTestServer();
    try { await use(app); } finally { await app.close(); }
  }, { scope: 'worker' }]
});

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
});

test('the game and its navigation require authentication', async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.getByRole('link', { name: 'Serpent', exact: true })).toHaveCount(0);
  await page.goto(`${app.url}/snake`);
  await expect(page).toHaveURL(`${app.url}/login`);
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible();
});

test('connected players can score, pause, steer, restart and keep their own record on mobile', async ({ page, app, browser }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-16T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-16T12:00:01Z'));
  // Place the first fruit two cells ahead, so scoring can be tested reliably.
  await page.addInitScript(() => { Math.random = () => 207.5 / 397; });
  const response = await page.request.post(`${app.url}/api/users`, {
    data: { name: 'Joueur Serpent', email: 'snake-player@example.invalid', password: 'snake-test-password' }
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  await page.addInitScript((token) => localStorage.setItem('token', token), token);
  await page.goto(`${app.url}/posts`);
  await page.getByRole('link', { name: 'Serpent', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Le jeu du serpent', exact: true })).toBeVisible();
  const board = page.getByRole('application', { name: 'Plateau du jeu du serpent' });
  const score = page.getByLabel(/^Score : /);
  const record = page.getByLabel(/^Mon record : /);
  const status = page.getByRole('status');
  await expect(score).toHaveText('0');
  await page.getByRole('button', { name: 'Commencer', exact: true }).click();
  await expect(board).toBeFocused();
  await expect(status).toHaveText('En cours');
  // After growing to four cells, put the next fruit directly ahead as well.
  await page.evaluate(() => { Math.random = () => 207.5 / 396; });
  await page.clock.runFor(320);
  await expect(score).toHaveText('10');
  await expect(record).toHaveText('10');
  // A better record saved by another tab must never be overwritten.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) => key.startsWith('devconnector:snake:'));
    localStorage.setItem(key, '50');
  });
  await page.clock.runFor(160);
  await expect(score).toHaveText('20');
  await expect(record).toHaveText('50');

  await board.press('Space');
  await expect(status).toHaveText('En pause');
  const pausedBoard = await board.locator('svg').innerHTML();
  await page.clock.runFor(3000);
  expect(await board.locator('svg').innerHTML()).toBe(pausedBoard);
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await board.press('ArrowUp');
  await page.clock.runFor(1600);
  await expect(status).toHaveText('En cours');
  await page.clock.runFor(160);
  await expect(status).toHaveText('Partie terminée');
  await page.getByRole('button', { name: 'Rejouer', exact: true }).click();
  await expect(score).toHaveText('0');
  await expect(record).toHaveText('50');
  await page.reload();
  await expect(status).toHaveText('Prêt à jouer');
  await expect(record).toHaveText('50');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: 'Serpent', exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Commencer', exact: true }).click();
  await page.getByRole('button', { name: 'Aller vers le haut', exact: true }).click();
  await page.clock.runFor(1760);
  await expect(status).toHaveText('Partie terminée');
  await expect(record).toHaveText('50');
  const otherAccount = await page.request.post(`${app.url}/api/users`, {
    data: { name: 'Autre Joueur', email: 'snake-other@example.invalid', password: 'snake-test-password' }
  });
  expect(otherAccount.status()).toBe(200);
  const otherToken = (await otherAccount.json()).token;
  const context = await browser.newContext({ storageState: await page.context().storageState() });
  try {
    await context.route('https://**/*', (route) => route.abort());
    await context.addInitScript((token) => localStorage.setItem('token', token), otherToken);
    const otherPage = await context.newPage();
    await otherPage.goto(`${app.url}/snake`);
    await expect(otherPage.getByRole('heading', { name: 'Le jeu du serpent', exact: true })).toBeVisible();
    await expect(otherPage.getByLabel(/^Mon record : /)).toHaveText('0');
  } finally { await context.close(); }
  expect(errors).toEqual([]);
});
