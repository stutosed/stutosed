import 'server-only';
import { listPushTokens, upsertPushToken } from '@/server/repositories/push-tokens.repo';
import type { RegisterPushTokenInput, SendPushNotificationInput } from '@/schemas/notifications.schema';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

export async function registerDevicePushToken(
  input: RegisterPushTokenInput,
  authenticatedUserId?: string | null
): Promise<{ saved: true }> {
  await upsertPushToken({
    token: input.token.trim(),
    userId: authenticatedUserId || input.userId || null,
    platform: input.platform,
    deviceName: input.deviceName || null,
  });
  return { saved: true };
}

export async function sendPushNotificationBroadcast(
  input: SendPushNotificationInput
): Promise<{ totalTokens: number; sent: number; failed: number }> {
  const records = await listPushTokens(input.userId);
  const tokens = records
    .map((r) => r.token)
    .filter((t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

  if (tokens.length === 0) {
    return { totalTokens: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const chunk = tokens.slice(i, i + EXPO_BATCH_SIZE).map((to) => ({
      to,
      sound: 'default',
      title: input.title,
      body: input.body,
      data: input.data || {},
      channelId: 'stutosed_updates',
      priority: 'high',
    }));

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      failed += chunk.length;
      continue;
    }

    const json = (await res.json()) as { data?: Array<{ status?: string }> };
    const tickets = Array.isArray(json?.data) ? json.data : [];
    for (const ticket of tickets) {
      if (ticket?.status === 'ok') sent++;
      else failed++;
    }
    if (tickets.length === 0) {
      sent += chunk.length;
    }
  }

  return { totalTokens: tokens.length, sent, failed };
}
