import { z } from 'zod';

export const loginBody = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required').max(200),
  })
  .strict();
