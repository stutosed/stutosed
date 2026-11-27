import { Course, LectureItem } from '@/types';
import manifestData from '@/data/courses-manifest.json';

// In-memory cache for on-demand lazy loaded course details
const courseDetailsCache = new Map<string, Course>();

// Lightweight manifest list of active courses (BEU removed)
export const INITIAL_COURSES: Course[] = ((manifestData as unknown as Course[]) || []).filter(
  (c) => c.id !== 'beu-1st-year' && (c.category || '').toLowerCase() !== 'beu'
);

export function getCourseById(id: string): Course | undefined {
  if (!id) return undefined;
  return courseDetailsCache.get(id) || INITIAL_COURSES.find((c) => c.id === id);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  if (!categoryId || categoryId === 'all') return INITIAL_COURSES;
  return INITIAL_COURSES.filter((c) => (c.category || '').toLowerCase() === categoryId.toLowerCase());
}

/**
 * Lazy loads the full course details (tabs, lectures, items, parmarData, prathamBySubject)
 * on demand as a separate code-split static chunk.
 */
export async function loadCourseDetails(courseId: string): Promise<Course | null> {
  if (!courseId) return null;
  if (courseDetailsCache.has(courseId)) {
    return courseDetailsCache.get(courseId)!;
  }
  try {
    const courseModule = await import(`@/data/courses/${courseId}.json`);
    const course = (courseModule.default || courseModule) as Course;
    courseDetailsCache.set(courseId, course);
    return course;
  } catch (err) {
    console.warn(`[coursesData] Failed to lazy load course details for: ${courseId}`, err);
    return getCourseById(courseId) || null;
  }
}

export function countCourseStats(course: Course): { videos: number; resources: number } {
  if (course.stats) {
    return course.stats;
  }

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

export function getTotalStats(): { totalVideos: number; totalPDFs: number; totalCourses: number } {
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
 * Resolves watched lecture URL keys from Turso back to readable lecture metadata.
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
            [item.url, item.links?.url, item.id, `${course.id}-${tab.id}-${idx}`, ...serverUrls],
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
            [item.url, item.links?.url, item.id, `${course.id}-${subjKey}-${idx}`, ...serverUrls],
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
