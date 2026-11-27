import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, LectureItem } from '../types';
import { API_BASE_URL } from '../lib/config';
import manifestData from './courses-manifest.json';

const REMOTE_MANIFEST_KEY = '@stutosed/remote-manifest-v1';
const REMOTE_COURSE_PREFIX = '@stutosed/remote-course-v1:';

const courseDetailsCache = new Map<string, Course>();
const catalogListeners = new Set<() => void>();
let catalogVersion = 0;

function filterVisibleCourses(list: Course[]): Course[] {
  return (list || []).filter(
    (c) => c && c.id !== 'beu-1st-year' && (c.category || '').toLowerCase() !== 'beu'
  );
}

export const INITIAL_COURSES: Course[] = filterVisibleCourses(
  (manifestData as unknown as Course[]) || []
);

function notifyCatalogUpdated() {
  catalogVersion += 1;
  catalogListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function subscribeCatalogChange(listener: () => void): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

/**
 * React hook that triggers re-render whenever live remote courses finish updating.
 */
export function useCatalogVersion(): number {
  const [ver, setVer] = useState(catalogVersion);
  useEffect(() => {
    setVer(catalogVersion);
    return subscribeCatalogChange(() => setVer(catalogVersion));
  }, []);
  return ver;
}

function applyManifestList(nextCourses: Course[]) {
  const cleaned = filterVisibleCourses(nextCourses);
  if (cleaned.length === 0) return;
  INITIAL_COURSES.splice(0, INITIAL_COURSES.length, ...cleaned);
  notifyCatalogUpdated();
}

// Hydrate any cached remote courses immediately in background
AsyncStorage.getItem(REMOTE_MANIFEST_KEY)
  .then((raw) => {
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      applyManifestList(parsed as Course[]);
    }
  })
  .catch(() => {});

// Static course registry matching exact filenames in ./courses/ for Metro offline fallback
const COURSE_MODULES: Record<string, () => Promise<{ default: Course }>> = {
  'aarambh-batch-100hr-sw': () => import('./courses/aarambh-batch-100hr-sw.json') as any,
  'banking-quant-hero': () => import('./courses/banking-quant-hero.json') as any,
  'computer': () => import('./courses/computer.json') as any,
  'eng-practice-31': () => import('./courses/eng-practice-31.json') as any,
  'english-practice': () => import('./courses/english-practice.json') as any,
  'english-spl': () => import('./courses/english-spl.json') as any,
  'gate-ece-made-easy-signal-system': () =>
    import('./courses/gate-ece-made-easy-signal-system.json') as any,
  'maths-b39': () => import('./courses/maths-b39.json') as any,
  'maths-special-1': () => import('./courses/maths-special-1.json') as any,
  'maths-special-vod-2': () => import('./courses/maths-special-vod-2.json') as any,
  'maths-special-vod': () => import('./courses/maths-special-vod.json') as any,
  'maths-spl-b42': () => import('./courses/maths-spl-b42.json') as any,
  'maths-spl-b43': () => import('./courses/maths-spl-b43.json') as any,
  'maths-spl38': () => import('./courses/maths-spl38.json') as any,
  'parmar-gk-3-0': () => import('./courses/parmar-gk-3-0.json') as any,
  'parmar': () => import('./courses/parmar.json') as any,
  'pratham': () => import('./courses/pratham.json') as any,
  'reasoning-spl-38': () => import('./courses/reasoning-spl-38.json') as any,
  'reasoning-spl-58': () => import('./courses/reasoning-spl-58.json') as any,
  'reasoning': () => import('./courses/reasoning.json') as any,
  'selection-batch-1': () => import('./courses/selection-batch-1.json') as any,
  'ssc-complete-vod': () => import('./courses/ssc-complete-vod.json') as any,
  'vocab-mastery-vod': () => import('./courses/vocab-mastery-vod.json') as any,
};

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pulls live courses catalog from website backend so new courses & batches appear
 * in mobile app automatically without rebuilding/reinstalling the APK.
 */
export async function syncRemoteCoursesCatalog(): Promise<boolean> {
  const data = await fetchJsonWithTimeout<{ courses?: Course[] }>(
    `${API_BASE_URL}/api/v1/courses?_ts=${Date.now()}`
  );
  if (data?.courses && Array.isArray(data.courses) && data.courses.length > 0) {
    applyManifestList(data.courses);
    AsyncStorage.setItem(REMOTE_MANIFEST_KEY, JSON.stringify(data.courses)).catch(() => {});
    return true;
  }
  return false;
}

export function getCourseById(id: string): Course | undefined {
  if (!id) return undefined;
  return courseDetailsCache.get(id) || INITIAL_COURSES.find((c) => c.id === id);
}

export function isGovernmentCategory(category?: string): boolean {
  const c = (category || '').toLowerCase();
  return c === 'government' || c === 'gov-exams';
}

export function getCoursesByCategory(categoryId: string): Course[] {
  if (!categoryId || categoryId === 'all') return INITIAL_COURSES;
  if (categoryId.toLowerCase() === 'government') {
    return INITIAL_COURSES.filter((c) => isGovernmentCategory(c.category));
  }
  return INITIAL_COURSES.filter(
    (c) => (c.category || '').toLowerCase() === categoryId.toLowerCase()
  );
}

export async function loadCourseDetails(
  courseId: string,
  forceRefresh = false
): Promise<Course | null> {
  if (!courseId) return null;
  if (!forceRefresh && courseDetailsCache.has(courseId)) {
    return courseDetailsCache.get(courseId)!;
  }

  // 1. Fetch live course JSON from backend when online / refreshing
  const remoteCourse = await fetchJsonWithTimeout<Course>(
    `${API_BASE_URL}/api/v1/courses/${encodeURIComponent(courseId)}?_ts=${Date.now()}`,
    9000
  );
  if (remoteCourse && remoteCourse.id) {
    courseDetailsCache.set(courseId, remoteCourse);
    AsyncStorage.setItem(
      `${REMOTE_COURSE_PREFIX}${courseId}`,
      JSON.stringify(remoteCourse)
    ).catch(() => {});
    return remoteCourse;
  }

  // 2. Fallback to cached remote course JSON
  try {
    const cachedRaw = await AsyncStorage.getItem(`${REMOTE_COURSE_PREFIX}${courseId}`);
    if (cachedRaw) {
      const cachedCourse = JSON.parse(cachedRaw) as Course;
      if (cachedCourse?.id) {
        courseDetailsCache.set(courseId, cachedCourse);
        return cachedCourse;
      }
    }
  } catch {}

  // 3. Offline fallback to static APK-bundled JSON
  try {
    const loader = COURSE_MODULES[courseId];
    if (loader) {
      const mod = await loader();
      const course = (mod.default || mod) as Course;
      courseDetailsCache.set(courseId, course);
      return course;
    }
  } catch (err) {
    console.warn(`[coursesData] Failed to load details for: ${courseId}`, err);
  }
  return getCourseById(courseId) || null;
}

export function countCourseStats(course: Course): { videos: number; resources: number } {
  if (course.stats) return course.stats;

  if (course.isParmar && course.parmarData) {
    let videos = 0;
    let resources = 0;
    for (const subj of Object.values(course.parmarData)) {
      for (const lec of subj.lectures) {
        if (lec.links && lec.links.url) videos++;
        if (lec.links) {
          resources += Object.keys(lec.links).filter((k) => k !== 'url').length;
        }
      }
    }
    return { videos, resources };
  }

  if (course.isPratham && course.prathamBySubject) {
    let videos = 0;
    let resources = 0;
    for (const items of Object.values(course.prathamBySubject)) {
      items.forEach((item) => {
        if (item.category === 'videos' || item.type !== 'pdf') videos++;
        else resources++;
      });
    }
    return { videos, resources };
  }

  let videos = 0;
  let resources = 0;
  for (const tab of course.tabs || []) {
    for (const item of tab.items || []) {
      if (item.type === 'pdf') resources++;
      else videos++;
    }
  }
  return { videos, resources };
}

export function getTotalStats(): {
  totalVideos: number;
  totalPDFs: number;
  totalCourses: number;
} {
  let totalVideos = 0;
  let totalPDFs = 0;
  for (const c of INITIAL_COURSES) {
    const stats = countCourseStats(c);
    totalVideos += stats.videos;
    totalPDFs += stats.resources;
  }
  return {
    totalVideos,
    totalPDFs,
    totalCourses: INITIAL_COURSES.length,
  };
}

export interface WatchedLectureMatch {
  label: string;
  courseId: string;
  courseName: string;
  lecture: LectureItem;
  tabId?: string;
}

/**
 * Resolves watchedMap keys (URLs or generated lecture keys) back to human-readable
 * lecture titles & course metadata across local & remote course catalogs.
 */
export async function resolveWatchedLecturesMap(
  watchKeys: string[]
): Promise<Record<string, WatchedLectureMatch>> {
  const result: Record<string, WatchedLectureMatch> = {};
  if (!watchKeys || watchKeys.length === 0) return result;

  const remaining = new Set(watchKeys);

  const tryMatch = (
    keys: (string | undefined)[],
    label: string,
    course: Course,
    lecture: LectureItem,
    tabId?: string
  ) => {
    for (const k of keys) {
      if (k && remaining.has(k)) {
        result[k] = {
          label,
          courseId: course.id,
          courseName: course.name,
          lecture,
          tabId,
        };
        remaining.delete(k);
      }
    }
  };

  for (const c of INITIAL_COURSES) {
    if (remaining.size === 0) break;
    const course = await loadCourseDetails(c.id);
    if (!course) continue;

    if (course.tabs && course.tabs.length > 0) {
      for (const tab of course.tabs) {
        tab.items.forEach((item, idx) => {
          const serverUrls = item.servers?.map((s) => s.url) || [];
          tryMatch(
            [
              item.url,
              item.links?.url,
              item.id,
              `${course.id}-${tab.id}-${idx}`,
              ...serverUrls,
            ],
            item.label,
            course,
            item,
            tab.id
          );
        });
      }
    }

    if (course.isParmar && course.parmarData) {
      for (const [subjKey, subj] of Object.entries(course.parmarData)) {
        subj.lectures.forEach((lec, idx) => {
          const lecItem: LectureItem = {
            id: `${subjKey}-${idx}`,
            label: lec.title,
            url: lec.links?.url || '',
            type: lec.links?.url?.endsWith('.pdf') ? 'pdf' : 'external',
            links: lec.links,
            subject: subjKey,
          };
          tryMatch(
            [lec.links?.url, `${course.id}-${subjKey}-${idx}`, `${subjKey}-${idx}`],
            lec.title,
            course,
            lecItem,
            subjKey
          );
        });
      }
    }

    if (course.isPratham && course.prathamBySubject) {
      for (const [subjKey, items] of Object.entries(course.prathamBySubject)) {
        items.forEach((item, idx) => {
          const serverUrls = item.servers?.map((s) => s.url) || [];
          tryMatch(
            [
              item.url,
              item.links?.url,
              item.id,
              `${course.id}-${subjKey}-${idx}`,
              ...serverUrls,
            ],
            item.label,
            course,
            item,
            subjKey
          );
        });
      }
    }
  }

  return result;
}
