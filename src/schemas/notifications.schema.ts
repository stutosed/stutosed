import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  userId: z.string().max(128).optional(),
  deviceName: z.string().max(128).optional(),
});

export const sendPushNotificationSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  userId: z.string().max(128).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type SendPushNotificationInput = z.infer<typeof sendPushNotificationSchema>;
