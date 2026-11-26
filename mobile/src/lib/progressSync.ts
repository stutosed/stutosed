import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { authClient } from './auth-client';
import { CourseMemory } from '../types';

const WATCHED_KEY = 'onafbu_watched_v1';
const LAST_PLAYED_KEY = 'stutosed_last_played_v1';
const BOOKMARK_KEY = 'stutosed_bookmarked_courses';
const STUDENT_ID_KEY = 'stutosed_student_id';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const cookie = await authClient.getCookie();
    if (cookie) {
      headers['Cookie'] = cookie;
    }
  } catch {}
  return headers;
}

export async function getOrCreateStudentId(authUserId?: string | null): Promise<string> {
  if (authUserId) return authUserId;
  try {
    let localId = await AsyncStorage.getItem(STUDENT_ID_KEY);
    if (!localId) {
      localId = 'std_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      await AsyncStorage.setItem(STUDENT_ID_KEY, localId);
    }
    return localId;
  } catch {
    return 'guest_student';
  }
}

export async function loadLocalLearningState(): Promise<{
  watchedMap: Record<string, number>;
  bookmarks: string[];
  lastPlayed: CourseMemory | null;
}> {
  try {
    const [wRaw, bRaw, lRaw] = await Promise.all([
      AsyncStorage.getItem(WATCHED_KEY),
      AsyncStorage.getItem(BOOKMARK_KEY),
      AsyncStorage.getItem(LAST_PLAYED_KEY),
    ]);
    return {
      watchedMap: wRaw ? JSON.parse(wRaw) : {},
      bookmarks: bRaw ? JSON.parse(bRaw) : [],
      lastPlayed: lRaw ? JSON.parse(lRaw) : null,
    };
  } catch {
    return { watchedMap: {}, bookmarks: [], lastPlayed: null };
  }
}

export async function pullCloudUserData(userId: string): Promise<{
  watchedMap: Record<string, number>;
  bookmarks: string[];
  lastPlayed: CourseMemory | null;
}> {
  const local = await loadLocalLearningState();
  if (!userId) return local;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/sync?userId=${encodeURIComponent(userId)}`,
      { headers }
    );
    if (!res.ok) return local;

    const json = await res.json();
    const data = json?.data || json;
    if (!data) return local;

    const mergedWatched = { ...local.watchedMap };
    if (Array.isArray(data.watchHistory)) {
      for (const item of data.watchHistory) {
        if (item.lecture_url && !mergedWatched[item.lecture_url]) {
          mergedWatched[item.lecture_url] = item.watched_at
            ? new Date(item.watched_at).getTime()
            : Date.now();
        }
      }
    }

    const mergedBookmarks = Array.from(
      new Set([
        ...local.bookmarks,
        ...(Array.isArray(data.bookmarks) ? data.bookmarks : []),
      ])
    );

    let lastPlayed = local.lastPlayed;
    if (Array.isArray(data.courseMemory) && data.courseMemory.length > 0) {
      const latest = data.courseMemory[0];
      const cloudTs = latest.updated_at ? new Date(latest.updated_at).getTime() : 0;
      if (!lastPlayed || cloudTs > (lastPlayed.timestamp || 0)) {
        lastPlayed = {
          courseId: latest.course_id,
          tabId: latest.last_tab_id || 'videos',
          url: latest.last_lecture_url,
          timestamp: cloudTs || Date.now(),
        };
      }
    }

    await Promise.all([
      AsyncStorage.setItem(WATCHED_KEY, JSON.stringify(mergedWatched)),
      AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(mergedBookmarks)),
      lastPlayed
        ? AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(lastPlayed))
        : Promise.resolve(),
    ]);

    return {
      watchedMap: mergedWatched,
      bookmarks: mergedBookmarks,
      lastPlayed,
    };
  } catch (err) {
    console.warn('[sync] Cloud pull failed, using local cache:', err);
    return local;
  }
}

export async function pushSyncAction(
  userId: string,
  action: 'watch' | 'progress' | 'bookmark' | 'memory' | 'profile',
  payload: Record<string, any>
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/api/v1/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, action, payload }),
    });
  } catch {}
}

export async function saveWatchedLocally(watchedMap: Record<string, number>): Promise<void> {
  try {
    await AsyncStorage.setItem(WATCHED_KEY, JSON.stringify(watchedMap));
  } catch {}
}

export async function saveBookmarksLocally(bookmarks: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  } catch {}
}

export async function saveLastPlayedLocally(memory: CourseMemory): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(memory));
  } catch {}
}
