import { Course } from '../types';
import manifestData from './courses-manifest.json';

const courseDetailsCache = new Map<string, Course>();

export const INITIAL_COURSES: Course[] = (manifestData as unknown as Course[]) || [];

// Static course registry matching exact filenames in ./courses/ for Metro bundler
const COURSE_MODULES: Record<string, () => Promise<{ default: Course }>> = {
  'aarambh-batch-100hr-sw': () => import('./courses/aarambh-batch-100hr-sw.json') as any,
  'banking-quant-hero': () => import('./courses/banking-quant-hero.json') as any,
  'beu-1st-year': () => import('./courses/beu-1st-year.json') as any,
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

export async function loadCourseDetails(courseId: string): Promise<Course | null> {
  if (!courseId) return null;
  if (courseDetailsCache.has(courseId)) {
    return courseDetailsCache.get(courseId)!;
  }
  try {
    const loader = COURSE_MODULES[courseId];
    if (loader) {
      const module = await loader();
      const course = (module.default || module) as Course;
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
