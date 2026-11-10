import { z } from 'zod';

export const syncGetQuerySchema = z.object({
  userId: z.string().min(1),
});

export const syncPostBodySchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['watch', 'progress', 'bookmark', 'saveVideo', 'memory', 'profile']),
  payload: z.record(z.string(), z.any()),
});

export type SyncGetQuery = z.infer<typeof syncGetQuerySchema>;
export type SyncPostBody = z.infer<typeof syncPostBodySchema>;
