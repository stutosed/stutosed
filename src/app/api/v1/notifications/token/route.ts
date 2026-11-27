import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { registerPushTokenSchema } from '@/schemas/notifications.schema';
import { registerDevicePushToken } from '@/server/services/notifications.service';

export const dynamic = 'force-dynamic';

export const POST = withApi(
  async ({ body, user }) => {
    const result = await registerDevicePushToken(body, user?.id || null);
    return ok(result, 200);
  },
  {
    bodySchema: registerPushTokenSchema,
    requireAuth: false,
    rateLimit: { limit: 60, windowSeconds: 60 },
  }
);
