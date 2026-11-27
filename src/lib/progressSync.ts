'use client';

/**
 * Turso Database Cloud Progress & Library Sync Engine (Turso-Only, Zero localStorage Sync Cache)
 * All synced student state (watch history, video progress, course memory, bookmarks, saved videos)
 * lives strictly in Turso SQLite via /api/v1/sync and is held only in memory for the active session.
 */

import type { SavedVideoItem } from '@/lib/libraryStorage';
import type { UserProfile } from '@/types';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { getCourseById } from '@/lib/coursesData';

export interface LastPlayedMemory {
  courseId: string;
  courseName: string;
  courseThumb: string;
  lectureTitle: string;
  url: string;
  timestamp: number;
}

interface CloudSyncResponse {
  watchHistory: Array<{ lecture_url: string; course_id: string; watched_at: string }>;
  videoProgress: Array<{ lecture_id: string; seconds: number; duration?: number }>;
  bookmarks: string[];
  savedVideos: SavedVideoItem[];
  courseMemory: Array<{ course_id: string; last_tab_id: string; last_lecture_url: string; updated_at: string }>;
  profile: UserProfile | null;
}

const LEGACY_SYNC_KEYS = [
  'onafbu_watched_v1',
  'stutosed_watched_lectures',
  'stutosed_last_played_v1',
  'stutosed_last_played',
  'last_played',
  'stutosed_bookmarked_courses',
  'stutosed_saved_videos',
  'stutosed_student_id',
  'stutosed_user_profile',
  'stutosed_user_name',
  'stutosed_member_since',
];

const progressThrottleMap = new Map<string, number>();

// Strictly in-memory session state populated from Turso (never persisted to localStorage)
let activeSyncUserId: string | null = null;
let pendingSessionPromise: Promise<string | null> | null = null;
let cloudWatchedMap: Record<string, number> = {};
let cloudVideoProgress: Record<string, number> = {};
let cloudBookmarks: string[] = [];
let cloudSavedVideos: SavedVideoItem[] = [];
let cloudLastPlayed: LastPlayedMemory | null = null;

function notifyProgressUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stutosed_progress_updated'));
  }
}

function notifyLibraryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stutosed_library_updated'));
  }
}

/**
 * Removes any legacy synced data from localStorage so no user sync state stays cached locally.
 */
export function purgeLegacyLocalSyncCache(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_SYNC_KEYS) {
      localStorage.removeItem(key);
    }
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('stutosed_progress_')) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      localStorage.removeItem(key);
    }
  } catch {}
}

export function clearInMemoryCloudState(): void {
  cloudWatchedMap = {};
  cloudVideoProgress = {};
  cloudBookmarks = [];
  cloudSavedVideos = [];
  cloudLastPlayed = null;
  progressThrottleMap.clear();
  notifyProgressUpdated();
  notifyLibraryUpdated();
}

export function setActiveSyncUser(user: UserProfile | null): void {
  activeSyncUserId = user?.id || null;
  pendingSessionPromise = null;
  purgeLegacyLocalSyncCache();
  if (!activeSyncUserId) {
    clearInMemoryCloudState();
  }
}

export async function resolveAuthenticatedUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (activeSyncUserId) return activeSyncUserId;
  if (!pendingSessionPromise) {
    pendingSessionPromise = authClient
      .getSession()
      .then((res) => {
        const uid = res?.data?.user?.id || null;
        activeSyncUserId = uid;
        return uid;
      })
      .catch(() => null)
      .finally(() => {
        pendingSessionPromise = null;
      });
  }
  return pendingSessionPromise;
}

export function getOrCreateStudentId(): string {
  return activeSyncUserId || '';
}

// =========================================================================
// IN-MEMORY GETTERS (HYDRATED FROM TURSO)
// =========================================================================
export function getWatchedLecturesMap(): Record<string, number> {
  return { ...cloudWatchedMap };
}

export function getLectureWatchKeys(item: {
  url?: string;
  id?: string;
  links?: Record<string, string>;
  servers?: Array<{ url?: string }>;
}): string[] {
  const candidates = [
    item.url,
    item.links?.url,
    ...(item.servers?.map((s) => s.url) || []),
    item.id,
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const trimmed = typeof c === 'string' ? c.trim() : '';
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export function getCanonicalLectureKey(item: {
  url?: string;
  id?: string;
  links?: Record<string, string>;
  servers?: Array<{ url?: string }>;
}): string {
  return getLectureWatchKeys(item)[0] || '';
}

export function isLectureWatched(urlOrItem: string | {
  url?: string;
  id?: string;
  links?: Record<string, string>;
  servers?: Array<{ url?: string }>;
}, overrideSet?: Set<string>): boolean {
  if (!urlOrItem) return false;
  if (typeof urlOrItem === 'string') {
    return overrideSet ? overrideSet.has(urlOrItem) : Boolean(cloudWatchedMap[urlOrItem]);
  }
  const keys = getLectureWatchKeys(urlOrItem);
  return keys.some((k) => (overrideSet ? overrideSet.has(k) : Boolean(cloudWatchedMap[k])));
}

export function getLastPlayedMemory(): LastPlayedMemory | null {
  return cloudLastPlayed;
}

export function getVideoProgressSeconds(lectureId: string): number {
  return lectureId ? cloudVideoProgress[lectureId] || 0 : 0;
}

export function getCloudBookmarks(): string[] {
  return [...cloudBookmarks];
}

export function setCloudBookmarksLocal(nextBookmarks: string[]): void {
  cloudBookmarks = Array.from(new Set(nextBookmarks));
  notifyLibraryUpdated();
}

export function getCloudSavedVideos(): SavedVideoItem[] {
  return [...cloudSavedVideos];
}

export function setCloudSavedVideosLocal(nextSaved: SavedVideoItem[]): void {
  cloudSavedVideos = [...nextSaved];
  notifyLibraryUpdated();
}

async function postSync(userId: string, action: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await apiClient('/api/v1/sync', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      body: JSON.stringify({ userId, action, payload }),
    });
  } catch (err) {
    console.warn(`[progressSync] Turso ${action} sync failed:`, err);
  }
}

/**
 * 1. SYNC WATCH HISTORY (MARK / UNMARK LECTURE)
 */
export async function syncLectureWatched(
  courseId: string,
  lectureUrl: string,
  label?: string,
  isWatched = true
): Promise<void> {
  if (typeof window === 'undefined' || !lectureUrl) return;

  if (isWatched) {
    cloudWatchedMap[lectureUrl] = Date.now();
  } else {
    delete cloudWatchedMap[lectureUrl];
  }
  notifyProgressUpdated();

  const userId = await resolveAuthenticatedUserId();
  if (!userId) return;

  await postSync(userId, 'watch', {
    courseId: courseId || 'unknown',
    lectureUrl,
    label,
    isWatched,
  });
}

/**
 * 2. SYNC COURSE MEMORY (LAST PLAYED LECTURE & CONTINUE WATCHING)
 */
export async function syncCourseMemory(
  courseId: string,
  subjectName: string,
  lectureUrl: string,
  meta?: {
    courseName?: string;
    courseThumb?: string;
    lectureTitle?: string;
  }
): Promise<void> {
  if (typeof window === 'undefined' || !lectureUrl) return;

  cloudLastPlayed = {
    courseId: courseId || '',
    courseName: meta?.courseName || '',
    courseThumb: meta?.courseThumb || '',
    lectureTitle: meta?.lectureTitle || '',
    url: lectureUrl,
    timestamp: Date.now(),
  };
  notifyProgressUpdated();

  const userId = await resolveAuthenticatedUserId();
  if (!userId) return;

  await postSync(userId, 'memory', {
    courseId: courseId || 'unknown',
    lastTabId: subjectName || 'videos',
    lastLectureUrl: lectureUrl,
  });
}

/**
 * 3. SYNC VIDEO PLAYBACK PROGRESS (RESUME SECONDS)
 */
export async function syncVideoProgress(
  lectureId: string,
  seconds: number,
  duration?: number
): Promise<void> {
  if (typeof window === 'undefined' || !lectureId || isNaN(seconds)) return;

  const floored = Math.floor(seconds);
  cloudVideoProgress[lectureId] = floored;

  const now = Date.now();
  const lastPush = progressThrottleMap.get(lectureId) || 0;
  if (now - lastPush < 8000) return;
  progressThrottleMap.set(lectureId, now);

  const userId = await resolveAuthenticatedUserId();
  if (!userId) return;

  await postSync(userId, 'progress', {
    lectureId,
    seconds: floored,
    duration: duration ? Math.floor(duration) : undefined,
  });
}

/**
 * 4. SYNC COURSE BOOKMARK (LIBRARY)
 */
export async function syncBookmark(courseId: string, isBookmarked: boolean): Promise<void> {
  if (typeof window === 'undefined' || !courseId) return;

  if (isBookmarked) {
    cloudBookmarks = Array.from(new Set([...cloudBookmarks, courseId]));
  } else {
    cloudBookmarks = cloudBookmarks.filter((id) => id !== courseId);
  }
  notifyLibraryUpdated();

  const userId = await resolveAuthenticatedUserId();
  if (!userId) return;

  await postSync(userId, 'bookmark', { courseId, isBookmarked });
}

/**
 * 5. SYNC SAVED VIDEO (LIBRARY PLAYLIST)
 */
export async function syncSavedVideo(video: SavedVideoItem, isSaved: boolean): Promise<void> {
  if (typeof window === 'undefined' || !video) return;

  const videoId = video.id || video.url;
  if (isSaved) {
    const exists = cloudSavedVideos.some((v) => v.id === videoId || v.url === video.url);
    if (!exists) {
      cloudSavedVideos = [video, ...cloudSavedVideos];
    }
  } else {
    cloudSavedVideos = cloudSavedVideos.filter((v) => v.id !== videoId && v.url !== video.url);
  }
  notifyLibraryUpdated();

  const userId = await resolveAuthenticatedUserId();
  if (!userId) return;

  await postSync(userId, 'saveVideo', {
    videoId,
    videoData: video,
    isSaved,
  });
}

/**
 * 6. PULL FULL CLOUD STATE DIRECTLY FROM TURSO (NO LOCAL CACHE MERGE)
 */
export async function pullCloudUserData(explicitUserId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  purgeLegacyLocalSyncCache();

  try {
    const userId = explicitUserId || (await resolveAuthenticatedUserId());
    if (!userId) {
      clearInMemoryCloudState();
      return;
    }

    const data = await apiClient<CloudSyncResponse>(
      `/api/v1/sync?userId=${encodeURIComponent(userId)}&_ts=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!data) return;

    const nextWatched: Record<string, number> = {};
    if (Array.isArray(data.watchHistory)) {
      for (const w of data.watchHistory) {
        if (w.lecture_url) {
          nextWatched[w.lecture_url] = w.watched_at
            ? new Date(w.watched_at).getTime() || Date.now()
            : Date.now();
        }
      }
    }
    cloudWatchedMap = nextWatched;

    cloudBookmarks = Array.isArray(data.bookmarks) ? [...data.bookmarks] : [];
    cloudSavedVideos = Array.isArray(data.savedVideos) ? [...data.savedVideos] : [];

    const nextProgress: Record<string, number> = {};
    if (Array.isArray(data.videoProgress)) {
      for (const p of data.videoProgress) {
        if (p.lecture_id && p.seconds > 0) {
          nextProgress[p.lecture_id] = p.seconds;
        }
      }
    }
    cloudVideoProgress = nextProgress;

    if (Array.isArray(data.courseMemory) && data.courseMemory.length > 0) {
      const top = data.courseMemory[0];
      const course = top.course_id ? getCourseById(top.course_id) : undefined;
      let lectureTitle = '';
      if (course?.tabs) {
        for (const tab of course.tabs) {
          const hit = tab.items?.find((item) => item.url === top.last_lecture_url);
          if (hit) {
            lectureTitle = hit.label;
            break;
          }
        }
      }
      cloudLastPlayed = {
        courseId: top.course_id,
        courseName: course?.name || top.course_id,
        courseThumb: course?.thumb || '',
        lectureTitle: lectureTitle || 'Resume Lecture',
        url: top.last_lecture_url,
        timestamp: top.updated_at ? new Date(top.updated_at).getTime() || Date.now() : Date.now(),
      };
    } else {
      cloudLastPlayed = null;
    }

    notifyProgressUpdated();
    notifyLibraryUpdated();
  } catch (err) {
    console.warn('[progressSync] Failed pulling Turso cloud data:', err);
  }
}
