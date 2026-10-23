import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@demo-crm.example', password: 'DemoPass123!' },
  { label: 'Sales', email: 'sales@demo-crm.example', password: 'DemoPass123!' },
];
