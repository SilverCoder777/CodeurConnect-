# DevConnector 2.0

A social network for developers built with React, Redux, Express and MongoDB.
Based on Brad Traversy's MERN Stack Front To Back course.

## Requirements

- Node.js 24 or later (`.nvmrc` records the validated version).
- npm and MongoDB. Development was verified with Node 24.19.0, npm 11.9.0 and MongoDB 7.
- Chromium for the optional browser test suite.

## Setup

Install the server and client separately using the committed lockfiles:

```sh
npm ci
npm ci --prefix client
```

Create `config/default.json` (ignored by Git):

```json
{
  "mongoURI": "mongodb://127.0.0.1:27017/codeurconnect_dev",
  "jwtSecret": "replace-with-a-random-local-secret"
}
```

Generate a local JWT key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Keep local configuration and credentials out of Git. An optional `githubToken`
configuration value enables the GitHub repositories section of profiles.

Start MongoDB before starting the application. With Docker, a local database can
be created using a named volume:

```sh
docker run -d --name codeurconnect-mongo -p 127.0.0.1:27017:27017 \
  -v codeurconnect-mongo-data:/data/db mongo:7
```

If that container already exists, use `docker start codeurconnect-mongo`.
Do not replace an existing database or its volume.

## Development

```sh
npm run dev
```

The Express API runs on port 5000 and the Vite client runs on port 3000.
Vite proxies `/api` requests to the local API. Node's built-in watch mode restarts
Express after backend changes, and Vite reloads client changes.
Use `npm run server` or `npm run client` to start either component separately.

The old `NODE_OPTIONS=--openssl-legacy-provider` setting is no longer needed.

## Production

```sh
npm run build
NODE_ENV=production npm start
```

The client builds into `client/build`. Express serves the compiled assets and
supports direct navigation to client routes. `PORT` overrides the API port.
The `heroku-postbuild` script installs the client from its lockfile and builds it.
Supply production configuration through supported node-config environment
configuration or an ignored `config/production.json`; never commit credentials.

## Verification

Build the client and keep MongoDB running before running tests:

```sh
npm run build
npm test
```

The API tests run the actual production server against a uniquely named MongoDB
database. They check production assets and deep links, validation, JWT
registration/login, URL normalization, profiles, education/experience,
posts, likes, comments and account deletion. Each run deletes only its own test
database. `MONGO_TEST_URI` can specify a different MongoDB server; the tests always
replace the database name with a unique test name and preserve URI options.

For real browser tests:

```sh
npx playwright install chromium
npm run test:e2e
```

To use an already installed Chromium instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Browser tests use the production build and an isolated test database. They check
public/private routing, registration, profile creation, posting/commenting,
authentication persistence, logout and login. External fonts and avatars are
blocked in tests so they do not require third-party network access.

Check dependency health in both packages:

```sh
npm outdated
npm outdated --prefix client
npm audit
npm audit --prefix client
```

## Dependency migration

All direct dependencies were updated to their current stable releases. The
client uses React 19, React Router 7, React Redux 9, Redux 5 and Vite 8.
Deprecated Create React App and Redux DevTools packages were replaced.
JSX files use the `.jsx` extension, React mounts through `createRoot`, and Redux
Thunk uses its named export. Axios and prop-types are declared directly in the
client rather than inherited from the server installation.

The API uses Express 5 and Mongoose 9. MongoDB connection options removed by
Mongoose were dropped, deleted APIs were replaced with `deleteOne` and
`findOneAndDelete`, and the SPA fallback uses Express 5's named wildcard.
The API begins listening after the database connects. Nodemon was replaced by
Node's native watch mode to remove vulnerable transitive dependencies.

## License

MIT. Original author: Brad Traversy, [Traversy Media](https://www.traversymedia.com).
