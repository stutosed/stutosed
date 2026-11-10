import 'server-only';
import { turso } from '@/server/db/turso';

export interface WatchHistoryRecord {
  lecture_url: string;
  course_id: string;
  watched_at: string;
}

export interface VideoProgressRecord {
  lecture_id: string;
  seconds: number;
  duration?: number;
}

export interface CourseMemoryRecord {
  course_id: string;
  last_tab_id: string;
  last_lecture_url: string;
  updated_at: string;
}

export interface UserSavedVideoRecord {
  video_id: string;
  video_data: any;
  saved_at: string;
}

export interface UserProfileRecord {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * 1. WATCH HISTORY
 */
export async function getWatchHistory(userId: string): Promise<WatchHistoryRecord[]> {
  try {
    const res = await turso.execute({
      sql: 'SELECT lecture_url, course_id, watched_at FROM user_watch_history WHERE user_id = ?',
      args: [userId],
    });
    return res.rows.map((r: any) => ({
      lecture_url: String(r.lecture_url),
      course_id: String(r.course_id),
      watched_at: String(r.watched_at),
    }));
  } catch (err) {
    console.error('[turso] getWatchHistory error:', err);
    return [];
  }
}

export async function upsertWatchHistory(
  userId: string,
  courseId: string,
  lectureUrl: string
): Promise<void> {
  try {
    await turso.execute({
      sql: `INSERT INTO user_watch_history (user_id, course_id, lecture_url, watched_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, lecture_url) DO UPDATE SET watched_at = datetime('now')`,
      args: [userId, courseId || 'unknown', lectureUrl],
    });
  } catch (err) {
    console.error('[turso] upsertWatchHistory error:', err);
  }
}

/**
 * 2. VIDEO PROGRESS (SEEK SECONDS)
 */
export async function getVideoProgress(userId: string): Promise<VideoProgressRecord[]> {
  try {
    const res = await turso.execute({
      sql: 'SELECT lecture_id, seconds, duration FROM user_video_progress WHERE user_id = ?',
      args: [userId],
    });
    return res.rows.map((r: any) => ({
      lecture_id: String(r.lecture_id),
      seconds: Number(r.seconds),
      duration: r.duration ? Number(r.duration) : undefined,
    }));
  } catch (err) {
    console.error('[turso] getVideoProgress error:', err);
    return [];
  }
}

export async function upsertVideoProgress(
  userId: string,
  lectureId: string,
  seconds: number,
  duration?: number
): Promise<void> {
  try {
    await turso.execute({
      sql: `INSERT INTO user_video_progress (user_id, lecture_id, seconds, duration, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, lecture_id) DO UPDATE SET seconds = ?, duration = ?, updated_at = datetime('now')`,
      args: [userId, lectureId, Math.floor(seconds), duration ? Math.floor(duration) : null, Math.floor(seconds), duration ? Math.floor(duration) : null],
    });
  } catch (err) {
    console.error('[turso] upsertVideoProgress error:', err);
  }
}

/**
 * 3. BOOKMARKS
 */
export async function getBookmarks(userId: string): Promise<string[]> {
  try {
    const res = await turso.execute({
      sql: 'SELECT course_id FROM user_bookmarks WHERE user_id = ?',
      args: [userId],
    });
    return res.rows.map((r: any) => String(r.course_id));
  } catch (err) {
    console.error('[turso] getBookmarks error:', err);
    return [];
  }
}

export async function setBookmark(userId: string, courseId: string, isBookmarked: boolean): Promise<void> {
  try {
    if (isBookmarked) {
      await turso.execute({
        sql: `INSERT INTO user_bookmarks (user_id, course_id, created_at)
              VALUES (?, ?, datetime('now'))
              ON CONFLICT(user_id, course_id) DO NOTHING`,
        args: [userId, courseId],
      });
    } else {
      await turso.execute({
        sql: 'DELETE FROM user_bookmarks WHERE user_id = ? AND course_id = ?',
        args: [userId, courseId],
      });
    }
  } catch (err) {
    console.error('[turso] setBookmark error:', err);
  }
}

/**
 * 4. SAVED VIDEOS
 */
export async function getSavedVideos(userId: string): Promise<any[]> {
  try {
    const res = await turso.execute({
      sql: 'SELECT video_data FROM user_saved_videos WHERE user_id = ?',
      args: [userId],
    });
    return res.rows.map((r: any) => {
      try {
        return JSON.parse(String(r.video_data));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (err) {
    console.error('[turso] getSavedVideos error:', err);
    return [];
  }
}

export async function setSavedVideo(userId: string, videoId: string, videoData: any, isSaved: boolean): Promise<void> {
  try {
    if (isSaved) {
      await turso.execute({
        sql: `INSERT INTO user_saved_videos (user_id, video_id, video_data, saved_at)
              VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(user_id, video_id) DO UPDATE SET video_data = ?, saved_at = datetime('now')`,
        args: [userId, videoId, JSON.stringify(videoData), JSON.stringify(videoData)],
      });
    } else {
      await turso.execute({
        sql: 'DELETE FROM user_saved_videos WHERE user_id = ? AND video_id = ?',
        args: [userId, videoId],
      });
    }
  } catch (err) {
    console.error('[turso] setSavedVideo error:', err);
  }
}

/**
 * 5. COURSE MEMORY (LAST PLAYED)
 */
export async function getCourseMemory(userId: string): Promise<CourseMemoryRecord[]> {
  try {
    const res = await turso.execute({
      sql: 'SELECT course_id, last_tab_id, last_lecture_url, updated_at FROM user_course_memory WHERE user_id = ? ORDER BY updated_at DESC',
      args: [userId],
    });
    return res.rows.map((r: any) => ({
      course_id: String(r.course_id),
      last_tab_id: String(r.last_tab_id),
      last_lecture_url: String(r.last_lecture_url),
      updated_at: String(r.updated_at),
    }));
  } catch (err) {
    console.error('[turso] getCourseMemory error:', err);
    return [];
  }
}

export async function upsertCourseMemory(
  userId: string,
  courseId: string,
  lastTabId: string,
  lastLectureUrl: string
): Promise<void> {
  try {
    await turso.execute({
      sql: `INSERT INTO user_course_memory (user_id, course_id, last_tab_id, last_lecture_url, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, course_id) DO UPDATE SET last_tab_id = ?, last_lecture_url = ?, updated_at = datetime('now')`,
      args: [userId, courseId, lastTabId, lastLectureUrl, lastTabId, lastLectureUrl],
    });
  } catch (err) {
    console.error('[turso] upsertCourseMemory error:', err);
  }
}

/**
 * 6. USER PROFILE
 */
export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  try {
    const res = await turso.execute({
      sql: 'SELECT id, email, full_name, avatar_url FROM users WHERE id = ?',
      args: [userId],
    });
    if (res.rows.length === 0) return null;
    const r: any = res.rows[0];
    return {
      id: String(r.id),
      email: String(r.email),
      full_name: r.full_name ? String(r.full_name) : undefined,
      avatar_url: r.avatar_url ? String(r.avatar_url) : undefined,
    };
  } catch (err) {
    console.error('[turso] getUserProfile error:', err);
    return null;
  }
}

export async function upsertUserProfile(
  userId: string,
  email: string,
  fullName?: string,
  avatarUrl?: string
): Promise<void> {
  try {
    await turso.execute({
      sql: `INSERT INTO users (id, email, full_name, avatar_url, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET email = ?, full_name = ?, avatar_url = ?, updated_at = datetime('now')`,
      args: [userId, email, fullName || null, avatarUrl || null, email, fullName || null, avatarUrl || null],
    });
  } catch (err) {
    console.error('[turso] upsertUserProfile error:', err);
  }
}
