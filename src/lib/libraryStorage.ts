'use client';

/**
 * Student Library & Bookmarks Store (Turso-Only via In-Memory Cloud State)
 * Keeps bookmarked batches and saved lectures in sync with Turso with zero localStorage caching.
 */

import {
  getCloudBookmarks,
  getCloudSavedVideos,
  setCloudBookmarksLocal,
  setCloudSavedVideosLocal,
  syncBookmark,
  syncSavedVideo,
} from '@/lib/progressSync';

export interface SavedVideoItem {
  id: string; // unique URL or ID
  label: string;
  url: string;
  courseId: string;
  courseName: string;
  courseCategory?: string;
  subject?: string;
  savedAt: number;
  type?: string;
  servers?: any[];
  links?: Record<string, string>;
}

export interface CourseVideoFolder {
  courseId: string;
  courseName: string;
  category?: string;
  videos: SavedVideoItem[];
}

// =========================================================================
// 1. BOOKMARKED COURSES
// =========================================================================
export function getBookmarkedCourseIds(): string[] {
  if (typeof window === 'undefined') return [];
  return getCloudBookmarks();
}

export function isCourseBookmarked(courseId: string): boolean {
  return getBookmarkedCourseIds().includes(courseId);
}

export function toggleCourseBookmark(courseId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getBookmarkedCourseIds();
  const exists = current.includes(courseId);
  const next = exists ? current.filter((id) => id !== courseId) : [...current, courseId];
  setCloudBookmarksLocal(next);

  syncBookmark(courseId, !exists).catch(() => {});
  return !exists;
}

// =========================================================================
// 2. SAVED LECTURE VIDEOS (GROUPED BY BATCH FOLDER)
// =========================================================================
export function getSavedVideos(): SavedVideoItem[] {
  if (typeof window === 'undefined') return [];
  return getCloudSavedVideos();
}

export function isVideoSaved(urlOrId: string): boolean {
  if (!urlOrId) return false;
  return getSavedVideos().some((v) => v.id === urlOrId || v.url === urlOrId);
}

export function toggleSaveVideo(video: Omit<SavedVideoItem, 'savedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  const current = getSavedVideos();
  const exists = current.some((v) => v.id === video.id || v.url === video.url);
  const fullItem: SavedVideoItem = { ...video, savedAt: Date.now() };
  let next: SavedVideoItem[];

  if (exists) {
    next = current.filter((v) => v.id !== video.id && v.url !== video.url);
  } else {
    next = [fullItem, ...current];
  }

  setCloudSavedVideosLocal(next);
  syncSavedVideo(fullItem, !exists).catch(() => {});
  return !exists;
}

export function removeSavedVideo(idOrUrl: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedVideos();
  const removed = current.find((v) => v.id === idOrUrl || v.url === idOrUrl);
  const next = current.filter((v) => v.id !== idOrUrl && v.url !== idOrUrl);
  setCloudSavedVideosLocal(next);

  if (removed) {
    syncSavedVideo(removed, false).catch(() => {});
  }
}

/**
 * Returns saved videos grouped by batch (course) cleanly for Library Folders UI.
 */
export function getSavedVideosGroupedByBatch(): CourseVideoFolder[] {
  const videos = getSavedVideos();
  const map = new Map<string, CourseVideoFolder>();

  for (const vid of videos) {
    const key = vid.courseId || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        courseId: key,
        courseName: vid.courseName || 'Other Batch',
        category: vid.courseCategory,
        videos: [],
      });
    }
    map.get(key)!.videos.push(vid);
  }

  return Array.from(map.values());
}
