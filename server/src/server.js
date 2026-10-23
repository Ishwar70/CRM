import { loadEnv } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';

export async function start(env = loadEnv()) {
  await connectDb(env.MONGODB_URI);
  const app = createApp(env);
  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  start().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
