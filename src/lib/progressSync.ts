'use client';

/**
 * Turso Database Cloud Progress & Library Sync Engine
 * Synchronizes student watch history, video playback positions, course memory,
 * and library bookmarks with Turso Edge SQLite Database via /api/v1/sync,
 * with an instant 0ms localStorage optimistic cache.
 */

import { SavedVideoItem } from '@/lib/libraryStorage';
import { apiClient } from '@/lib/api-client';

const WATCHED_KEY_V1 = 'onafbu_watched_v1';
const WATCHED_KEY_LEGACY = 'stutosed_watched_lectures';
const LAST_PLAYED_KEY_V1 = 'stutosed_last_played_v1';
const LAST_PLAYED_KEY_LEGACY = 'stutosed_last_played';
const BOOKMARK_KEY = 'stutosed_bookmarked_courses';
const SAVED_VIDEOS_KEY = 'stutosed_saved_videos';

const progressThrottleMap = new Map<string, number>();

/**
 * Gets or initializes student user ID
 */
export function getOrCreateStudentId(): string {
  if (typeof window === 'undefined') return 'guest';
  try {
    const profileRaw = localStorage.getItem('stutosed_user_profile');
    if (profileRaw) {
      const p = JSON.parse(profileRaw);
      if (p.id) return p.id;
    }
    let localId = localStorage.getItem('stutosed_student_id');
    if (!localId) {
      localId = 'std_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('stutosed_student_id', localId);
    }
    return localId;
  } catch {
    return 'guest_student';
  }
}

/**
 * 1. RECORD LECTURE WATCHED
 */
export async function syncLectureWatched(
  courseId: string,
  lectureUrl: string,
  lectureTitle?: string
): Promise<void> {
  if (typeof window === 'undefined' || !lectureUrl) return;

  const now = Date.now();

  try {
    const watchedMap = JSON.parse(localStorage.getItem(WATCHED_KEY_V1) || '{}');
    watchedMap[lectureUrl] = now;
    localStorage.setItem(WATCHED_KEY_V1, JSON.stringify(watchedMap));

    const legacyList = JSON.parse(localStorage.getItem(WATCHED_KEY_LEGACY) || '[]');
    if (!legacyList.includes(lectureUrl)) {
      legacyList.push(lectureUrl);
      localStorage.setItem(WATCHED_KEY_LEGACY, JSON.stringify(legacyList));
    }

    window.dispatchEvent(new Event('stutosed_progress_updated'));
  } catch {}

  // Sync to Turso database asynchronously
  try {
    const userId = getOrCreateStudentId();
    apiClient('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'watch',
        payload: { courseId, lectureUrl, lectureTitle },
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * 2. RECORD COURSE MEMORY (LAST PLAYED)
 */
export async function syncCourseMemory(
  courseId: string,
  tabId: string,
  lectureUrl: string,
  extraMeta?: { courseName?: string; courseThumb?: string; lectureTitle?: string }
): Promise<void> {
  if (typeof window === 'undefined' || !courseId || !lectureUrl) return;

  const mem = {
    courseId,
    courseName: extraMeta?.courseName || '',
    courseThumb: extraMeta?.courseThumb || '',
    lectureTitle: extraMeta?.lectureTitle || '',
    url: lectureUrl,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(LAST_PLAYED_KEY_V1, JSON.stringify(mem));
    localStorage.setItem(LAST_PLAYED_KEY_LEGACY, JSON.stringify(mem));
  } catch {}

  try {
    const userId = getOrCreateStudentId();
    apiClient('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'memory',
        payload: {
          courseId,
          lastTabId: tabId || 'videos',
          lastLectureUrl: lectureUrl,
        },
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * 3. RECORD VIDEO PLAYBACK PROGRESS (TIMESTAMP SECONDS)
 */
export async function syncVideoProgress(
  lectureKey: string,
  seconds: number,
  duration?: number
): Promise<void> {
  if (typeof window === 'undefined' || !lectureKey || seconds < 3) return;

  const storageKey = `stutosed_progress_${lectureKey}`;

  try {
    localStorage.setItem(storageKey, String(Math.floor(seconds)));
  } catch {}

  const now = Date.now();
  const lastSync = progressThrottleMap.get(lectureKey) || 0;
  if (now - lastSync < 6000) return; // Throttled every 6 seconds
  progressThrottleMap.set(lectureKey, now);

  try {
    const userId = getOrCreateStudentId();
    apiClient('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'progress',
        payload: {
          lectureId: lectureKey,
          seconds: Math.floor(seconds),
          duration: duration ? Math.floor(duration) : undefined,
        },
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * 4. SYNC BOOKMARKS
 */
export async function syncBookmark(courseId: string, isBookmarked: boolean): Promise<void> {
  if (typeof window === 'undefined' || !courseId) return;

  try {
    const localBookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
    const bmSet = new Set(localBookmarks);
    if (isBookmarked) {
      bmSet.add(courseId);
    } else {
      bmSet.delete(courseId);
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(Array.from(bmSet)));
    window.dispatchEvent(new Event('stutosed_library_updated'));
  } catch {}

  try {
    const userId = getOrCreateStudentId();
    apiClient('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'bookmark',
        payload: { courseId, isBookmarked },
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * 5. SYNC SAVED VIDEO
 */
export async function syncSavedVideo(video: SavedVideoItem, isSaved: boolean): Promise<void> {
  if (typeof window === 'undefined' || !video?.id) return;

  try {
    const localSaved: SavedVideoItem[] = JSON.parse(localStorage.getItem(SAVED_VIDEOS_KEY) || '[]');
    const videoKey = video.id || video.url;
    let updated: SavedVideoItem[];
    if (isSaved) {
      const exists = localSaved.some((v) => (v.id || v.url) === videoKey);
      if (!exists) {
        updated = [...localSaved, video];
      } else {
        updated = localSaved;
      }
    } else {
      updated = localSaved.filter((v) => (v.id || v.url) !== videoKey);
    }
    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('stutosed_library_updated'));
  } catch {}

  try {
    const userId = getOrCreateStudentId();
    apiClient('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'saveVideo',
        payload: {
          videoId: video.id || video.url,
          videoData: video,
          isSaved,
        },
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * 6. PULL USER DATA FROM TURSO
 */
export async function pullCloudUserData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const userId = getOrCreateStudentId();
    const data = await apiClient<{
      watchHistory: { lecture_url: string }[];
      videoProgress: { lecture_id: string; seconds: number }[];
      bookmarks: string[];
      savedVideos: SavedVideoItem[];
      courseMemory: { course_id: string; last_tab_id: string; last_lecture_url: string; updated_at: string }[];
    }>(`/api/v1/sync?userId=${encodeURIComponent(userId)}`);

    if (data) {
      // 1. Merge Watch History
      if (data.watchHistory && data.watchHistory.length > 0) {
        let localMap: Record<string, number> = {};
        try {
          localMap = JSON.parse(localStorage.getItem(WATCHED_KEY_V1) || '{}');
        } catch {}
        for (const item of data.watchHistory) {
          if (item.lecture_url && !localMap[item.lecture_url]) {
            localMap[item.lecture_url] = Date.now();
          }
        }
        localStorage.setItem(WATCHED_KEY_V1, JSON.stringify(localMap));
      }

      // 2. Merge Bookmarks
      if (data.bookmarks && data.bookmarks.length > 0) {
        let localBm: string[] = [];
        try {
          localBm = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
        } catch {}
        const mergedBm = Array.from(new Set([...localBm, ...data.bookmarks]));
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(mergedBm));
      }

      // 3. Merge Saved Videos
      if (data.savedVideos && data.savedVideos.length > 0) {
        let localSaved: SavedVideoItem[] = [];
        try {
          localSaved = JSON.parse(localStorage.getItem(SAVED_VIDEOS_KEY) || '[]');
        } catch {}
        const seen = new Set(localSaved.map((v) => v.id || v.url));
        for (const v of data.savedVideos) {
          if (v && !seen.has(v.id || v.url)) {
            localSaved.push(v);
            seen.add(v.id || v.url);
          }
        }
        localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(localSaved));
      }

      // 4. Merge Video Progress
      if (data.videoProgress && data.videoProgress.length > 0) {
        for (const p of data.videoProgress) {
          if (p.lecture_id && p.seconds) {
            const key = `stutosed_progress_${p.lecture_id}`;
            const cur = localStorage.getItem(key);
            if (!cur || parseFloat(cur) < p.seconds) {
              localStorage.setItem(key, String(p.seconds));
            }
          }
        }
      }

      window.dispatchEvent(new Event('stutosed_library_updated'));
      window.dispatchEvent(new Event('stutosed_progress_updated'));
    }
  } catch (err) {
    // Graceful offline fallback
  }
}
