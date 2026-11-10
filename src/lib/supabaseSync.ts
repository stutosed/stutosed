'use client';

/**
 * Local Progress & Library Sync Engine
 * Synchronizes student watch history, video playback positions, course memory,
 * and library bookmarks using localStorage.
 * Prepared for pluggable cloud backend authentication.
 */

import { SavedVideoItem } from '@/lib/libraryStorage';

const WATCHED_KEY_V1 = 'onafbu_watched_v1';
const WATCHED_KEY_LEGACY = 'stutosed_watched_lectures';
const LAST_PLAYED_KEY_V1 = 'stutosed_last_played_v1';
const LAST_PLAYED_KEY_LEGACY = 'stutosed_last_played';
const BOOKMARK_KEY = 'stutosed_bookmarked_courses';
const SAVED_VIDEOS_KEY = 'stutosed_saved_videos';

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
}

/**
 * 6. PULL USER DATA
 * Maintained for interface compatibility with components.
 */
export async function pullCloudUserData(): Promise<void> {
  // Pure local storage operation. Dispatches updates to UI.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stutosed_library_updated'));
    window.dispatchEvent(new Event('stutosed_progress_updated'));
  }
}
