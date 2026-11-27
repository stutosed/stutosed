import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { coursesListQuerySchema } from '@/schemas/courses.schema';
import { listCoursesCatalog } from '@/server/services/courses.service';

export const GET = withApi(
  async ({ query }) => {
    const courses = await listCoursesCatalog(query.category);
    return ok(
      { courses },
      200,
      {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    );
  },
  {
    querySchema: coursesListQuerySchema,
    requireAuth: false,
    rateLimit: { limit: 120, windowSeconds: 60 },
  }
);
