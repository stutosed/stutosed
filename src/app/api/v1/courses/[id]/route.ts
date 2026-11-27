import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { ValidationError } from '@/server/http/errors';
import { courseParamsSchema } from '@/schemas/courses.schema';
import { getCourseDetailById } from '@/server/services/courses.service';

export const GET = withApi(
  async ({ params }) => {
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = courseParamsSchema.safeParse({ id: rawId });
    if (!parsed.success) {
      throw new ValidationError('Invalid course ID');
    }

    const course = await getCourseDetailById(parsed.data.id);
    return ok(course, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    });
  },
  {
    requireAuth: false,
    rateLimit: { limit: 120, windowSeconds: 60 },
  }
);
