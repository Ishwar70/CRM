import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';

export async function setupTestApp() {
  const mongo = await MongoMemoryServer.create();
  const env = loadEnv({
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri(),
    JWT_SECRET: 'test-secret-at-least-16-chars',
    CLIENT_ORIGIN: 'http://localhost:5173',
    LOGIN_RATE_LIMIT: '1000',
  });
  await connectDb(env.MONGODB_URI);
  const app = createApp(env);

  return {
    app,
    env,
    async reset() {
      const collections = await mongoose.connection.db.collections();
      await Promise.all(collections.map((c) => c.deleteMany({})));
    },
    async teardown() {
      await disconnectDb();
      await mongo.stop();
    },
  };
}
