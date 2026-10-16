const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { createTestServer } = require('./helpers/server');

let app;
before(async () => { app = await createTestServer(); });
after(async () => { if (app) await app.close(); });

async function request(method, path, data, token, status = 200) {
  const response = await fetch(`${app.url}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-auth-token': token } : {})
    },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  assert.equal(response.status, status, `${method} ${path}`);
  return response.json();
}

test('production serves the SPA root, deep links and compiled JavaScript', async () => {
  for (const path of ['/', '/dashboard', '/profile/example']) {
    const response = await fetch(app.url + path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<html lang="fr">/);
    assert.match(html, /<div id="root"><\/div>/);
    const script = html.match(/<script[^>]+src="([^"]+)"/);
    assert.ok(script, 'production entry script exists');
    const asset = await fetch(app.url + script[1]);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
    assert.ok((await asset.text()).length > 1000);
  }
});

test('validation and authentication reject invalid requests', async () => {
  assert.equal((await request('GET', '/auth', undefined, undefined, 401)).msg,
    'Veuillez vous connecter pour accéder à cette ressource');
  assert.equal((await request('GET', '/auth', undefined, 'invalid-token', 401)).msg,
    'Votre session est invalide ou a expiré. Veuillez vous reconnecter.');
  const result = await request('POST', '/users', {}, undefined, 400);
  assert.equal(result.errors.length, 3);
  assert.deepEqual(result.errors.map((error) => error.msg), [
    'Le nom est obligatoire',
    'Veuillez saisir une adresse e-mail valide',
    'Le mot de passe doit contenir au moins 6 caractères'
  ]);
  await request('POST', '/auth', {}, undefined, 400);
  assert.equal((await request('GET', '/profile/user/not-an-id', undefined, undefined, 400)).msg,
    'Identifiant invalide');
});

test('registration, login, profile and post lifecycle work with updated dependencies', async () => {
  const account = { name: 'Dependency Test', email: 'dependencies@example.invalid', password: 'test-password-123' };
  const { token } = await request('POST', '/users', account);
  assert.equal(typeof token, 'string');
  const user = await request('GET', '/auth', undefined, token);
  assert.equal(user.email, account.email);
  assert.equal(user.password, undefined);
  assert.match(user.avatar, /^https:\/\//);
  await request('POST', '/users', account, undefined, 400);
  await request('POST', '/auth', { email: account.email, password: 'wrong-password' }, undefined, 400);
  const login = await request('POST', '/auth', account);
  assert.equal((await request('GET', '/auth', undefined, login.token))._id, user._id);

  const profile = await request('POST', '/profile', {
    status: 'Developer', skills: 'JavaScript,React', website: 'example.com', twitter: 'twitter.com/example'
  }, token);
  assert.equal(profile.status, 'Developer');
  assert.equal(profile.website, 'https://example.com');
  assert.equal(profile.social.twitter, 'https://twitter.com/example');
  assert.equal(profile.skills.length, 2);
  assert.equal((await request('GET', '/profile/me', undefined, token)).user._id, user._id);
  assert.equal((await request('GET', `/profile/user/${user._id}`)).status, 'Developer');
  assert.equal((await request('GET', '/profile')).length, 1);

  const experience = await request('PUT', '/profile/experience', {
    title: 'Developer', company: 'Example', from: '2020-01-01', current: true
  }, token);
  assert.equal(experience.experience.length, 1);
  assert.equal((await request('DELETE', `/profile/experience/${experience.experience[0]._id}`, undefined, token)).experience.length, 0);
  const education = await request('PUT', '/profile/education', {
    school: 'Example', degree: 'Degree', fieldofstudy: 'Computer Science', from: '2019-01-01'
  }, token);
  assert.equal(education.education.length, 1);
  assert.equal((await request('DELETE', `/profile/education/${education.education[0]._id}`, undefined, token)).education.length, 0);

  const post = await request('POST', '/posts', { text: 'Dependency upgrade' }, token);
  assert.equal((await request('GET', `/posts/${post._id}`, undefined, token)).text, post.text);
  assert.equal((await request('GET', '/posts', undefined, token)).length, 1);
  assert.equal((await request('PUT', `/posts/like/${post._id}`, undefined, token)).length, 1);
  await request('PUT', `/posts/like/${post._id}`, undefined, token, 400);
  assert.equal((await request('PUT', `/posts/unlike/${post._id}`, undefined, token)).length, 0);
  const comments = await request('POST', `/posts/comment/${post._id}`, { text: 'Comment test' }, token);
  assert.equal(comments[0].text, 'Comment test');
  assert.equal((await request('DELETE', `/posts/comment/${post._id}/${comments[0]._id}`, undefined, token)).length, 0);
  await request('DELETE', `/posts/${post._id}`, undefined, token);
  await request('GET', `/posts/${post._id}`, undefined, token, 404);

  // Account deletion must also remove any remaining posts and the profile.
  const remaining = await request('POST', '/posts', { text: 'Cascade deletion' }, token);
  await request('DELETE', '/profile', undefined, token);
  assert.equal((await request('GET', '/profile')).length, 0);
  await request('GET', `/profile/user/${user._id}`, undefined, undefined, 400);
  await request('GET', `/posts/${remaining._id}`, undefined, token, 404);
  await request('POST', '/auth', account, undefined, 400);
});
