// Local demo without installing MongoDB: boots an in-memory MongoDB, seeds fictional data, starts the API.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { loadEnv } from '../src/config/env.js';
import { start } from '../src/server.js';
import { seedDemoData } from '../src/services/seedService.js';

const mongo = await MongoMemoryServer.create();
const password = process.env.DEMO_PASSWORD ?? 'DemoPass123!';
const env = loadEnv({
  ...process.env,
  MONGODB_URI: mongo.getUri('crm-dashboard'),
  JWT_SECRET: process.env.JWT_SECRET ?? 'local-dev-only-secret-change-me',
});

await start(env);
const { users, leads } = await seedDemoData({ password });
console.log(`In-memory MongoDB seeded: ${users.length} users, ${leads?.length ?? 0} leads (demo accounts in README).`);

process.on('exit', () => mongo.stop());
