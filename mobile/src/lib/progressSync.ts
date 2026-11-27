import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { CourseMemory } from '../types';
import { getCourseById } from '../data/coursesData';

const LEGACY_SYNC_KEYS = [
  'onafbu_watched_v1',
  'stutosed_last_played_v1',
  'stutosed_bookmarked_courses',
  'stutosed_student_id',
];

export interface SyncPullResult {
  watchedMap: Record<string, number>;
  bookmarks: string[];
  lastPlayed: CourseMemory | null;
}

/**
 * Purges any legacy locally cached synced learning state so Turso remains
 * the single source of truth across app launches and sign-outs.
 */
export async function purgeLegacyLocalSyncCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(LEGACY_SYNC_KEYS);
  } catch {}
}

/**
 * Resolves a course title/lecture label from course catalog for Turso memory records.
 */
function hydrateLastPlayedFromCourse(
  courseId: string,
  lastTabId: string,
  lectureUrl: string,
  timestamp: number
): CourseMemory {
  const course = courseId ? getCourseById(courseId) : undefined;
  let lectureTitle = '';
  if (course?.tabs) {
    for (const tab of course.tabs) {
      const hit = tab.items?.find((item) => item.url === lectureUrl);
      if (hit) {
        lectureTitle = hit.label;
        break;
      }
    }
  }
  return {
    courseId,
    courseName: course?.name || courseId,
    lectureTitle: lectureTitle || 'Resume Lecture',
    tabId: lastTabId || 'videos',
    url: lectureUrl,
    timestamp,
  };
}

/**
 * Fetches full learning state directly from Turso /api/v1/sync for the authenticated user.
 * Never reads from or writes to local AsyncStorage cache.
 */
export async function pullCloudUserData(userId: string): Promise<SyncPullResult> {
  await purgeLegacyLocalSyncCache();
  if (!userId) {
    return { watchedMap: {}, bookmarks: [], lastPlayed: null };
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/sync?userId=${encodeURIComponent(userId)}&_ts=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      }
    );
    if (!res.ok) {
      return { watchedMap: {}, bookmarks: [], lastPlayed: null };
    }
    const json = await res.json();
    const data = json?.data || json;
    if (!data) {
      return { watchedMap: {}, bookmarks: [], lastPlayed: null };
    }

    const watchedMap: Record<string, number> = {};
    if (Array.isArray(data.watchHistory)) {
      for (const item of data.watchHistory) {
        if (item.lecture_url) {
          watchedMap[item.lecture_url] = item.watched_at
            ? new Date(item.watched_at).getTime() || Date.now()
            : Date.now();
        }
      }
    }

    const bookmarks: string[] = Array.isArray(data.bookmarks) ? [...data.bookmarks] : [];

    let lastPlayed: CourseMemory | null = null;
    if (Array.isArray(data.courseMemory) && data.courseMemory.length > 0) {
      const latest = data.courseMemory[0];
      const cloudTs = latest.updated_at ? new Date(latest.updated_at).getTime() : 0;
      lastPlayed = hydrateLastPlayedFromCourse(
        latest.course_id,
        latest.last_tab_id || 'videos',
        latest.last_lecture_url,
        cloudTs || Date.now()
      );
    }

    return { watchedMap, bookmarks, lastPlayed };
  } catch (err) {
    console.warn('[sync] Turso cloud pull failed:', err);
    return { watchedMap: {}, bookmarks: [], lastPlayed: null };
  }
}

export async function pushSyncAction(
  userId: string,
  action: 'watch' | 'progress' | 'bookmark' | 'saveVideo' | 'memory' | 'profile',
  payload: Record<string, unknown>
): Promise<void> {
  if (!userId) return;
  try {
    await fetch(`${API_BASE_URL}/api/v1/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, payload }),
    });
  } catch (err) {
    console.warn(`[sync] Turso ${action} push failed:`, err);
  }
}
