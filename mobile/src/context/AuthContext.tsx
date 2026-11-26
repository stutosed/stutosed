import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient } from '../lib/auth-client';
import { CourseMemory, UserProfile } from '../types';
import {
  getOrCreateStudentId,
  loadLocalLearningState,
  pullCloudUserData,
  pushSyncAction,
  saveBookmarksLocally,
  saveLastPlayedLocally,
  saveWatchedLocally,
} from '../lib/progressSync';

interface AuthContextValue {
  user: UserProfile | null;
  studentId: string;
  isLoading: boolean;
  isSyncing: boolean;
  watchedMap: Record<string, number>;
  bookmarks: string[];
  lastPlayed: CourseMemory | null;
  markLectureWatched: (courseId: string, lectureUrl: string) => void;
  toggleLectureWatched: (courseId: string, lectureUrl: string) => void;
  recordCourseMemory: (memory: CourseMemory) => void;
  toggleCourseBookmark: (courseId: string) => void;
  refreshSessionAndSync: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  studentId: 'guest_student',
  isLoading: true,
  isSyncing: false,
  watchedMap: {},
  bookmarks: [],
  lastPlayed: null,
  markLectureWatched: () => {},
  toggleLectureWatched: () => {},
  recordCourseMemory: () => {},
  toggleCourseBookmark: () => {},
  refreshSessionAndSync: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: sessionData, isPending, refetch } = authClient.useSession();

  const [studentId, setStudentId] = useState<string>('guest_student');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [watchedMap, setWatchedMap] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [lastPlayed, setLastPlayed] = useState<CourseMemory | null>(null);

  const user: UserProfile | null = sessionData?.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        full_name: sessionData.user.name || sessionData.user.email.split('@')[0],
        avatar_url: sessionData.user.image || undefined,
      }
    : null;

  const syncNow = useCallback(async (authId?: string | null) => {
    setIsSyncing(true);
    try {
      const local = await loadLocalLearningState();
      setWatchedMap(local.watchedMap);
      setBookmarks(local.bookmarks);
      setLastPlayed(local.lastPlayed);

      const resolvedId = await getOrCreateStudentId(authId);
      setStudentId(resolvedId);

      const cloud = await pullCloudUserData(resolvedId);
      setWatchedMap(cloud.watchedMap);
      setBookmarks(cloud.bookmarks);
      setLastPlayed(cloud.lastPlayed);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending) {
      syncNow(sessionData?.user?.id || null);
    }
  }, [isPending, sessionData?.user?.id, syncNow]);

  const markLectureWatched = useCallback(
    (courseId: string, lectureUrl: string) => {
      if (!lectureUrl) return;
      setWatchedMap((prev) => {
        const next = { ...prev, [lectureUrl]: Date.now() };
        saveWatchedLocally(next);
        return next;
      });
      pushSyncAction(studentId, 'watch', { courseId, lectureUrl });
    },
    [studentId]
  );

  const toggleLectureWatched = useCallback(
    (courseId: string, lectureUrl: string) => {
      if (!lectureUrl) return;
      setWatchedMap((prev) => {
        const next = { ...prev };
        if (next[lectureUrl]) {
          delete next[lectureUrl];
        } else {
          next[lectureUrl] = Date.now();
          pushSyncAction(studentId, 'watch', { courseId, lectureUrl });
        }
        saveWatchedLocally(next);
        return next;
      });
    },
    [studentId]
  );

  const recordCourseMemory = useCallback(
    (memory: CourseMemory) => {
      if (!memory.courseId || !memory.url) return;
      setLastPlayed(memory);
      saveLastPlayedLocally(memory);
      pushSyncAction(studentId, 'memory', {
        courseId: memory.courseId,
        lastTabId: memory.tabId || 'videos',
        lastLectureUrl: memory.url,
      });
    },
    [studentId]
  );

  const toggleCourseBookmark = useCallback(
    (courseId: string) => {
      setBookmarks((prev) => {
        const isBookmarked = prev.includes(courseId);
        const next = isBookmarked
          ? prev.filter((id) => id !== courseId)
          : [...prev, courseId];
        saveBookmarksLocally(next);
        pushSyncAction(studentId, 'bookmark', {
          courseId,
          isBookmarked: !isBookmarked,
        });
        return next;
      });
    },
    [studentId]
  );

  const refreshSessionAndSync = useCallback(async () => {
    await refetch();
    const latestSession = await authClient.getSession();
    const uid = latestSession?.data?.user?.id || null;
    await syncNow(uid);
  }, [refetch, syncNow]);

  const signOutUser = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {}
    await syncNow(null);
  }, [syncNow]);

  return (
    <AuthContext.Provider
      value={{
        user,
        studentId,
        isLoading: isPending,
        isSyncing,
        watchedMap,
        bookmarks,
        lastPlayed,
        markLectureWatched,
        toggleLectureWatched,
        recordCourseMemory,
        toggleCourseBookmark,
        refreshSessionAndSync,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
