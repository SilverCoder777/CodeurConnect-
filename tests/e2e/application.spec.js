const { test: base, expect } = require('@playwright/test');
const { createTestServer } = require('../helpers/server');

const test = base.extend({
  app: [async ({}, use) => {
    const app = await createTestServer();
    try { await use(app); } finally { await app.close(); }
  }, { scope: 'worker' }]
});

test.use({ locale: 'en-US' });

test.beforeEach(async ({ page }) => {
  // External fonts and avatars are optional; exercise the real local API.
  await page.route('https://**/*', (route) => route.abort());
});

test('public routes render and private routes redirect guests', async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle('Bienvenue sur DevConnector');
  await expect(page.getByRole('heading', { name: 'Le réseau des développeurs' })).toBeVisible();
  await page.goto(`${app.url}/profiles`);
  await expect(page.getByRole('heading', { name: 'Développeurs', exact: true })).toBeVisible();
  await page.goto(`${app.url}/dashboard`);
  await expect(page).toHaveURL(`${app.url}/login`);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await page.goto(`${app.url}/page-inconnue`);
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
});

test('React, Redux and routing support registration, profiles, posts and login', async ({ page, app }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = 'browser-test@example.invalid';
  const password = 'browser-test-password-123';
  await page.goto(`${app.url}/register`);
  await page.getByPlaceholder('Nom', { exact: true }).fill('Browser Test');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill(password);
  await page.getByPlaceholder('Confirmer le mot de passe').fill(password);
  await page.getByRole('button', { name: 'S’inscrire', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByText('Bienvenue Browser Test')).toBeVisible();
  await page.getByRole('link', { name: 'Créer mon profil' }).click();
  await page.locator('select[name="status"]').selectOption({ label: 'Développeur' });
  await expect(page.locator('select[name="status"]')).toHaveValue('Developer');
  await page.locator('input[name="skills"]').fill('JavaScript,React');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByRole('link', { name: 'Modifier le profil' })).toBeVisible();
  await expect(page.getByText('Profil créé', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Développeurs', exact: true }).click();
  await expect(page.getByText('Développeur', { exact: true })).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Rechercher des développeurs' });
  await search.fill('réact');
  await search.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'résultat' })).toHaveText('1 résultat pour « réact »');
  await page.getByRole('link', { name: 'Voir le profil' }).click();
  await expect(page.getByText('Aucune expérience renseignée')).toBeVisible();
  await expect(page.getByText('Aucune formation renseignée')).toBeVisible();

  await page.getByRole('link', { name: 'Publications', exact: true }).click();
  await page.getByPlaceholder('Rédiger une publication').fill('Browser dependency upgrade');
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await expect(page.getByText('Browser dependency upgrade', { exact: true })).toBeVisible();
  await expect(page.locator('.post-date').first()).toHaveText(/Publié le \d{2}\/\d{2}\/\d{4}/);
  await expect(page.getByText('Publication créée', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'J’aime cette publication', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retirer la mention J’aime', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Retirer la mention J’aime', exact: true }).click();
  await expect(page.getByRole('button', { name: 'J’aime cette publication', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('link', { name: 'Discussion' }).click();
  await page.getByPlaceholder('Commenter la publication').fill('Browser comment');
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await expect(page.getByText('Browser comment', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Browser comment', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
  await page.getByPlaceholder('Adresse e-mail').fill(email);
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/dashboard`);
  await expect(page.getByText('Bienvenue Browser Test')).toBeVisible();
  await page.getByRole('link', { name: 'Ajouter une expérience' }).click();
  await page.getByPlaceholder('* Intitulé du poste', { exact: true }).fill('Développeur web');
  await page.getByPlaceholder('* Entreprise', { exact: true }).fill('Entreprise française');
  await page.locator('input[name="from"]').fill('2020-01-02');
  await page.locator('input[name="current"]').check();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Expériences professionnelles' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Entreprise française' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '02/01/2020 - Aujourd’hui' })).toBeVisible();
  await page.getByRole('link', { name: 'Ajouter une formation' }).click();
  await page.getByPlaceholder('* Établissement ou formation', { exact: true }).fill('École de test');
  await page.getByPlaceholder('* Diplôme ou certification', { exact: true }).fill('Diplôme de test');
  await page.getByPlaceholder('Domaine d’études', { exact: true }).fill('Informatique');
  await page.locator('input[name="from"]').fill('2019-09-01');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Formations et diplômes' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'École de test' })).toBeVisible();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
  await expect(page).toHaveURL(`${app.url}/login`);
  await expect(page.getByText('Votre compte a été définitivement supprimé')).toBeVisible();
  expect(errors).toEqual([]);
});

test('validation messages are French even with an English browser', async ({ page, app }) => {
  await page.goto(`${app.url}/register`);
  await page.getByPlaceholder('Nom', { exact: true }).fill('Test de traduction');
  await page.getByPlaceholder('Adresse e-mail').fill('validation@example.invalid');
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill('123456');
  await page.getByPlaceholder('Confirmer le mot de passe').fill('654321');
  await page.getByRole('button', { name: 'S’inscrire', exact: true }).click();
  await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible();
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill('123');
  await page.getByPlaceholder('Confirmer le mot de passe').fill('123');
  await page.getByRole('button', { name: 'S’inscrire', exact: true }).click();
  await expect(page.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeVisible();
  await page.goto(`${app.url}/login`);
  await page.getByPlaceholder('Adresse e-mail').fill('validation@example.invalid');
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();
});

test('mobile navigation, search and forms remain usable without horizontal scrolling', async ({ page, app }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/profiles', '/login', '/register']) {
      await page.goto(app.url + path);
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
  const search = page.getByRole('searchbox', { name: 'Rechercher des développeurs' });
  await search.fill('profil-inexistant');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: 'Développeurs', exact: true })).toBeVisible();
  await expect(page.getByText('Aucun profil trouvé…')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'résultat' })).toHaveText('0 résultat pour « profil-inexistant »');
});
