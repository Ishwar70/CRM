import { z } from 'zod';
import { ROLES } from '../models/User.js';

export const createUserBody = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Invalid email'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    role: z.enum(ROLES, { errorMap: () => ({ message: 'Role must be admin or sales' }) }).default('sales'),
  })
  .strict();

export const userStatusBody = z.object({ isActive: z.boolean({ required_error: 'isActive is required' }) }).strict();
