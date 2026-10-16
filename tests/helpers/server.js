const { spawn } = require('node:child_process');
const { randomUUID, randomBytes } = require('node:crypto');
const path = require('node:path');
const mongoose = require('mongoose');

// Every run owns a separate database; never clear a configured application DB.
async function createTestServer() {
  const uri = new URL(
    process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = `/codeurconnect_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(uri.href, {
    serverSelectionTimeoutMS: 5000
  }).asPromise();

  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '0',
      NODE_CONFIG: JSON.stringify({
        mongoURI: uri.href,
        jwtSecret: randomBytes(32).toString('hex')
      })
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const close = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
    try {
      await connection.dropDatabase();
    } finally {
      await connection.close();
    }
  };

  try {
    const port = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('Test server startup timed out')), 15000);
      const finish = (fn, value) => {
        clearTimeout(timeout);
        fn(value);
      };
      child.once('error', (err) => finish(reject, err));
      child.once('exit', () => finish(reject, new Error('Test server exited before becoming ready')));
      child.stdout.on('data', (data) => {
        output += data;
        const match = output.match(/Server started on port (\d+)/);
        if (match) finish(resolve, Number(match[1]));
      });
      // Consume stderr without exposing credentials from a connection error.
      child.stderr.resume();
    });
    return { url: `http://127.0.0.1:${port}`, close };
  } catch (err) {
    await close();
    throw err;
  }
}

module.exports = { createTestServer };
