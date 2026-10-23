import { User } from '../models/User.js';

export const DEMO_USERS = [
  { name: 'Avery Admin', email: 'admin@demo-crm.example', role: 'admin' },
  { name: 'Sam Sales', email: 'sales@demo-crm.example', role: 'sales' },
  { name: 'Riley Reyes', email: 'riley@demo-crm.example', role: 'sales' },
];

export async function seedDemoData({ password }) {
  await User.deleteMany({});
  const passwordHash = await User.hashPassword(password);
  const users = await User.insertMany(DEMO_USERS.map((u) => ({ ...u, passwordHash })));
  return { users };
}
