import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { syncGetQuerySchema, syncPostBodySchema } from '@/schemas/sync.schema';
import * as tursoRepo from '@/server/repositories/turso-progress.repo';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sync?userId=...
 * Pulls all user learning data from Turso
 */
export const GET = withApi(
  async ({ query }) => {
    const { userId } = query as { userId: string };

    const [watchHistory, videoProgress, bookmarks, savedVideos, courseMemory, profile] =
      await Promise.all([
        tursoRepo.getWatchHistory(userId),
        tursoRepo.getVideoProgress(userId),
        tursoRepo.getBookmarks(userId),
        tursoRepo.getSavedVideos(userId),
        tursoRepo.getCourseMemory(userId),
        tursoRepo.getUserProfile(userId),
      ]);

    return ok({
      userId,
      watchHistory,
      videoProgress,
      bookmarks,
      savedVideos,
      courseMemory,
      profile,
    });
  },
  {
    querySchema: syncGetQuerySchema,
    rateLimit: { limit: 120, windowSeconds: 60 },
  }
);

/**
 * POST /api/v1/sync
 * Pushes learning data to Turso
 */
export const POST = withApi(
  async ({ body }) => {
    const { userId, action, payload } = body as {
      userId: string;
      action: 'watch' | 'progress' | 'bookmark' | 'saveVideo' | 'memory' | 'profile';
      payload: any;
    };

    switch (action) {
      case 'watch':
        await tursoRepo.upsertWatchHistory(userId, payload.courseId, payload.lectureUrl);
        break;

      case 'progress':
        await tursoRepo.upsertVideoProgress(
          userId,
          payload.lectureId,
          payload.seconds,
          payload.duration
        );
        break;

      case 'bookmark':
        await tursoRepo.setBookmark(userId, payload.courseId, payload.isBookmarked);
        break;

      case 'saveVideo':
        await tursoRepo.setSavedVideo(userId, payload.videoId, payload.videoData, payload.isSaved);
        break;

      case 'memory':
        await tursoRepo.upsertCourseMemory(
          userId,
          payload.courseId,
          payload.lastTabId,
          payload.lastLectureUrl
        );
        break;

      case 'profile':
        await tursoRepo.upsertUserProfile(
          userId,
          payload.email,
          payload.fullName,
          payload.avatarUrl
        );
        break;
    }

    return ok({ success: true, action });
  },
  {
    bodySchema: syncPostBodySchema,
    rateLimit: { limit: 200, windowSeconds: 60 },
  }
);
