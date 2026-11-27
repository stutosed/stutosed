import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authClient } from '../lib/auth-client';
import { CourseMemory, LectureItem, SavedVideoItem, UserProfile } from '../types';
import {
  purgeLegacyLocalSyncCache,
  pullCloudUserData,
  pushSyncAction,
} from '../lib/progressSync';

interface AuthContextValue {
  user: UserProfile | null;
  studentId: string;
  isLoading: boolean;
  isSyncing: boolean;
  watchedMap: Record<string, number>;
  bookmarks: string[];
  savedVideos: SavedVideoItem[];
  lastPlayed: CourseMemory | null;
  markLectureWatched: (courseId: string, lectureUrl: string) => void;
  toggleLectureWatched: (courseId: string, lectureUrl: string) => void;
  recordCourseMemory: (memory: CourseMemory) => void;
  toggleCourseBookmark: (courseId: string) => void;
  toggleSaveVideo: (lecture: LectureItem, courseId: string, courseName: string) => boolean;
  removeSavedVideo: (idOrUrl: string) => void;
  refreshSessionAndSync: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  studentId: '',
  isLoading: true,
  isSyncing: false,
  watchedMap: {},
  bookmarks: [],
  savedVideos: [],
  lastPlayed: null,
  markLectureWatched: () => {},
  toggleLectureWatched: () => {},
  recordCourseMemory: () => {},
  toggleCourseBookmark: () => {},
  toggleSaveVideo: () => false,
  removeSavedVideo: () => {},
  refreshSessionAndSync: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: sessionData, isPending, refetch } = authClient.useSession();

  const sessionUserId = sessionData?.user?.id || '';
  const [studentId, setStudentId] = useState<string>(sessionUserId);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [watchedMap, setWatchedMap] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [savedVideos, setSavedVideos] = useState<SavedVideoItem[]>([]);
  const [lastPlayed, setLastPlayed] = useState<CourseMemory | null>(null);

  // Always keep latest authenticated user ID accessible immediately without stale closures
  const activeUserIdRef = useRef<string>(sessionUserId);
  if (sessionUserId) {
    activeUserIdRef.current = sessionUserId;
  }

  const user: UserProfile | null = sessionData?.user
    ? {
        id: sessionData.user.id,
        email: sessionData.user.email,
        full_name: sessionData.user.name || 'Student',
        avatar_url: sessionData.user.image || undefined,
      }
    : null;

  const resolveUserId = useCallback(async (): Promise<string | null> => {
    if (activeUserIdRef.current) return activeUserIdRef.current;
    try {
      const latest = await authClient.getSession();
      const uid = latest?.data?.user?.id || null;
      if (uid) {
        activeUserIdRef.current = uid;
        setStudentId(uid);
      }
      return uid;
    } catch {
      return null;
    }
  }, []);

  const syncNow = useCallback(async (authId?: string | null) => {
    setIsSyncing(true);
    try {
      await purgeLegacyLocalSyncCache();
      if (!authId) {
        activeUserIdRef.current = '';
        setStudentId('');
        setWatchedMap({});
        setBookmarks([]);
        setSavedVideos([]);
        setLastPlayed(null);
        return;
      }

      activeUserIdRef.current = authId;
      setStudentId(authId);
      const cloud = await pullCloudUserData(authId);
      setWatchedMap(cloud.watchedMap);
      setBookmarks(cloud.bookmarks);
      setSavedVideos(cloud.savedVideos);
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

  // Automatically re-sync from Turso whenever app returns to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        resolveUserId().then((uid) => {
          if (uid) syncNow(uid);
        });
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [resolveUserId, syncNow]);

  const markLectureWatched = useCallback(
    (courseId: string, lectureUrl: string) => {
      if (!lectureUrl) return;
      setWatchedMap((prev) => ({ ...prev, [lectureUrl]: Date.now() }));
      resolveUserId().then((uid) => {
        if (uid) {
          pushSyncAction(uid, 'watch', { courseId, lectureUrl, isWatched: true });
        }
      });
    },
    [resolveUserId]
  );

  const toggleLectureWatched = useCallback(
    (courseId: string, lectureUrl: string) => {
      if (!lectureUrl) return;
      let willBeWatched = true;
      setWatchedMap((prev) => {
        const next = { ...prev };
        willBeWatched = !next[lectureUrl];
        if (!willBeWatched) {
          delete next[lectureUrl];
        } else {
          next[lectureUrl] = Date.now();
        }
        return next;
      });
      resolveUserId().then((uid) => {
        if (uid) {
          pushSyncAction(uid, 'watch', {
            courseId,
            lectureUrl,
            isWatched: willBeWatched,
          });
        }
      });
    },
    [resolveUserId]
  );

  const recordCourseMemory = useCallback(
    (memory: CourseMemory) => {
      setLastPlayed(memory);
      resolveUserId().then((uid) => {
        if (uid) {
          pushSyncAction(uid, 'memory', {
            courseId: memory.courseId,
            lastTabId: memory.tabId || 'videos',
            lastLectureUrl: memory.url,
          });
        }
      });
    },
    [resolveUserId]
  );

  const toggleCourseBookmark = useCallback(
    (courseId: string) => {
      if (!courseId) return;
      let nextIsBookmarked = true;
      setBookmarks((prev) => {
        const isBookmarked = prev.includes(courseId);
        nextIsBookmarked = !isBookmarked;
        return isBookmarked
          ? prev.filter((id) => id !== courseId)
          : [...prev, courseId];
      });
      resolveUserId().then((uid) => {
        if (uid) {
          pushSyncAction(uid, 'bookmark', {
            courseId,
            isBookmarked: nextIsBookmarked,
          });
        }
      });
    },
    [resolveUserId]
  );

  const toggleSaveVideo = useCallback(
    (lecture: LectureItem, courseId: string, courseName: string): boolean => {
      const videoUrl = lecture.url || lecture.links?.url || lecture.servers?.[0]?.url || '';
      const videoId = lecture.id || videoUrl;
      if (!videoId) return false;

      const exists = savedVideos.some((v) => v.id === videoId || v.url === videoUrl);
      const nextSavedState = !exists;
      const fullItem: SavedVideoItem = {
        id: videoId,
        label: lecture.label,
        url: videoUrl,
        courseId,
        courseName,
        subject: lecture.subject,
        savedAt: Date.now(),
        type: lecture.type,
        fileStoreUrl: lecture.fileStoreUrl,
        streamBotUrl: lecture.streamBotUrl,
        servers: lecture.servers,
        links: lecture.links,
      };

      setSavedVideos((prev) =>
        nextSavedState
          ? [fullItem, ...prev.filter((v) => v.id !== videoId && v.url !== videoUrl)]
          : prev.filter((v) => v.id !== videoId && v.url !== videoUrl)
      );

      resolveUserId().then((uid) => {
        if (uid) {
          pushSyncAction(uid, 'saveVideo', {
            videoId,
            videoData: fullItem,
            isSaved: nextSavedState,
          });
        }
      });
      return nextSavedState;
    },
    [savedVideos, resolveUserId]
  );

  const removeSavedVideo = useCallback(
    (idOrUrl: string) => {
      if (!idOrUrl) return;
      const target = savedVideos.find((v) => v.id === idOrUrl || v.url === idOrUrl);
      setSavedVideos((prev) => prev.filter((v) => v.id !== idOrUrl && v.url !== idOrUrl));
      resolveUserId().then((uid) => {
        if (uid && target) {
          pushSyncAction(uid, 'saveVideo', {
            videoId: target.id || target.url,
            videoData: target,
            isSaved: false,
          });
        }
      });
    },
    [savedVideos, resolveUserId]
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
    await purgeLegacyLocalSyncCache();
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
        savedVideos,
        lastPlayed,
        markLectureWatched,
        toggleLectureWatched,
        recordCourseMemory,
        toggleCourseBookmark,
        toggleSaveVideo,
        removeSavedVideo,
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
