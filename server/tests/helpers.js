import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { User } from '../src/models/User.js';
import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';

export const TEST_PASSWORD = 'Password123!';

export async function createUser(overrides = {}) {
  const { password = TEST_PASSWORD, ...rest } = overrides;
  return User.create({
    name: 'Test User',
    email: `user-${new mongoose.Types.ObjectId()}@test.example`,
    role: 'sales',
    passwordHash: await User.hashPassword(password),
    ...rest,
  });
}

export async function loginAgent(app, user, password = TEST_PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: user.email, password });
  if (res.status !== 200) throw new Error(`Login failed in test: ${res.status} ${res.body.message}`);
  return agent;
}

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
