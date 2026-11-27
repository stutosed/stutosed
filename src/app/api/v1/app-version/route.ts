import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { getLatestMobileAppVersion } from '@/server/services/app-version.service';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  async () => {
    const info = await getLatestMobileAppVersion();
    return ok(info, 200, {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    });
  },
  {
    requireAuth: false,
    rateLimit: { limit: 120, windowSeconds: 60 },
  }
);
