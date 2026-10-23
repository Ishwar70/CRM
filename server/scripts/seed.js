import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { seedDemoData } from '../src/services/seedService.js';

const env = loadEnv();
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 8) {
  console.error('Set DEMO_PASSWORD (min 8 chars) before seeding.');
  process.exit(1);
}

await connectDb(env.MONGODB_URI);
const result = await seedDemoData({ password });
console.log(
  `Seeded ${result.users.length} users${result.leads ? ` and ${result.leads.length} leads` : ''} into ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`,
);
await disconnectDb();
