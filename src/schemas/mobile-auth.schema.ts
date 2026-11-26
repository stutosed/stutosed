import { z } from 'zod';

export const mobileAuthQuerySchema = z.object({
  action: z.enum(['complete', 'poll']),
  token: z.string().min(16).max(128),
  redirect: z.string().optional(),
});

export type MobileAuthQuery = z.infer<typeof mobileAuthQuerySchema>;
