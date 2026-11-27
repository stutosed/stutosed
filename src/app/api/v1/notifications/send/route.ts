import { timingSafeEqual } from 'crypto';
import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { UnauthorizedError } from '@/server/http/errors';
import { sendPushNotificationSchema } from '@/schemas/notifications.schema';
import { sendPushNotificationBroadcast } from '@/server/services/notifications.service';

export const dynamic = 'force-dynamic';

function isAuthorizedAdminSecret(provided: string | null): boolean {
  const expected = process.env.NOTIFY_ADMIN_SECRET || '';
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const POST = withApi(
  async ({ req, body }) => {
    const headerSecret =
      req.headers.get('x-admin-secret') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      null;

    if (!isAuthorizedAdminSecret(headerSecret)) {
      throw new UnauthorizedError('Invalid or missing admin notification secret');
    }

    const result = await sendPushNotificationBroadcast(body);
    return ok(result, 200);
  },
  {
    bodySchema: sendPushNotificationSchema,
    requireAuth: false,
    rateLimit: { limit: 20, windowSeconds: 60 },
  }
);
