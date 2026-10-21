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

test('Tetris is reserved for connected users', async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.getByRole('link', { name: 'Tetris', exact: true })).toHaveCount(0);
  await page.goto(`${app.url}/tetris`);
  await expect(page).toHaveURL(`${app.url}/login`);
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible();
});

test('Tetris supports keyboard and touch controls, gravity, pause, game over and local records', async ({ page, app }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
  const response = await page.request.post(`${app.url}/api/users`, {
    data: { name: 'Joueur Tetris', email: 'tetris-player@example.invalid', password: 'tetris-test-password' }
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  await page.addInitScript((token) => localStorage.setItem('token', token), token);
  await page.goto(`${app.url}/posts`);
  await page.getByRole('link', { name: 'Tetris', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tetris', exact: true })).toBeVisible();
  const board = page.getByRole('application', { name: 'Plateau de Tetris' });
  const description = page.locator('#tetris-board-description');
  const score = page.getByLabel(/^Score : /);
  const record = page.getByLabel(/^Mon record : /);
  const status = page.getByRole('status');
  await expect(score).toHaveText('0');
  await expect(record).toHaveText('0');
  await expect(page.getByRole('img', { name: /Prochaine pièce :/ })).toBeVisible();
  await page.getByRole('button', { name: 'Commencer', exact: true }).click();
  await expect(board).toBeFocused();
  await expect(status).toHaveText('En cours');
  const original = await description.textContent();
  await board.press('ArrowLeft');
  await expect(description).not.toHaveText(original);
  await board.press('ArrowRight');
  await expect(description).toHaveText(original);
  await board.press('ArrowDown');
  await expect(score).toHaveText('1');
  await expect(record).toHaveText('1');
  const beforeGravity = await description.textContent();
  await page.clock.runFor(800);
  await expect(description).not.toHaveText(beforeGravity);

  await board.press('p');
  await expect(status).toHaveText('En pause');
  const paused = await board.locator('svg').innerHTML();
  await page.clock.runFor(10000);
  expect(await board.locator('svg').innerHTML()).toBe(paused);
  await expect(page.getByRole('button', { name: 'Tourner la pièce', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await board.press('ArrowUp');
  // A better record saved by another tab must never be reduced.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) => key.startsWith('devconnector:tetris:'));
    localStorage.setItem(key, '1000');
  });
  await board.press('Space');
  await expect.poll(async () => Number(await score.textContent())).toBeGreaterThan(1);
  await expect(record).toHaveText('1000');
  await page.getByRole('button', { name: 'Mettre en pause', exact: true }).click();

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: 'Tetris', exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('button', { name: 'Déplacer à gauche', exact: true }).click();
  await page.getByRole('button', { name: 'Tourner la pièce', exact: true }).click();
  const beforeDrop = Number(await score.textContent());
  await page.getByRole('button', { name: 'Descendre la pièce', exact: true }).click();
  await expect(score).toHaveText(String(beforeDrop + 1));
  // Stacking in the spawn columns eventually fills the board and ends the game.
  for (let piece = 0; piece < 35 && await status.textContent() !== 'Partie terminée'; piece += 1) {
    await page.getByRole('button', { name: 'Faire tomber la pièce', exact: true }).click();
  }
  await expect(status).toHaveText('Partie terminée');
  await page.getByRole('button', { name: 'Rejouer', exact: true }).click();
  await expect(score).toHaveText('0');
  await expect(record).toHaveText('1000');
  await page.reload();
  await expect(status).toHaveText('Prêt à jouer');
  await expect(record).toHaveText('1000');
  expect(errors).toEqual([]);
});
