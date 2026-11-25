import { Course } from '../types';
import manifestData from './courses-manifest.json';

// In-memory cache for loaded course details
const courseDetailsCache = new Map<string, Course>();

// Lightweight manifest list of all courses (~10 KB total) for dashboard, filters, and cards
export const INITIAL_COURSES: Course[] = (manifestData as unknown as Course[]) || [];

// Static course registry for bundle-safe loading in React Native
const COURSE_MODULES: Record<string, () => Promise<{ default: Course }>> = {
  'beu-btech-1st-year': () => import('./courses/beu-btech-1st-year.json') as any,
  'gate-ece-made-easy': () => import('./courses/gate-ece-made-easy.json') as any,
  'parmar-ssc-complete': () => import('./courses/parmar-ssc-complete.json') as any,
  'ssc-parmar-gk-batch-3': () => import('./courses/ssc-parmar-gk-batch-3.json') as any,
  'ssc-parmar-gk-static-2': () => import('./courses/ssc-parmar-gk-static-2.json') as any,
  'ssc-parmar-gk-static-batch-1': () => import('./courses/ssc-parmar-gk-static-batch-1.json') as any,
  'ssc-parmar-science': () => import('./courses/ssc-parmar-science.json') as any,
  'ssc-abhishek-reasoning': () => import('./courses/ssc-abhishek-reasoning.json') as any,
  'ssc-abhishek-reasoning-chsl': () => import('./courses/ssc-abhishek-reasoning-chsl.json') as any,
  'ssc-aditya-maths-v1': () => import('./courses/ssc-aditya-maths-v1.json') as any,
  'ssc-aditya-maths-v2': () => import('./courses/ssc-aditya-maths-v2.json') as any,
  'ssc-aman-english-v1': () => import('./courses/ssc-aman-english-v1.json') as any,
  'ssc-aman-english-v2': () => import('./courses/ssc-aman-english-v2.json') as any,
  'ssc-bhupendra-hindi': () => import('./courses/ssc-bhupendra-hindi.json') as any,
  'ssc-careerwill-english': () => import('./courses/ssc-careerwill-english.json') as any,
  'ssc-careerwill-maths': () => import('./courses/ssc-careerwill-maths.json') as any,
  'ssc-careerwill-reasoning': () => import('./courses/ssc-careerwill-reasoning.json') as any,
  'ssc-gagan-maths': () => import('./courses/ssc-gagan-maths.json') as any,
  'ssc-jaideep-english': () => import('./courses/ssc-jaideep-english.json') as any,
  'ssc-piyush-reasoning': () => import('./courses/ssc-piyush-reasoning.json') as any,
  'ssc-rakesh-maths': () => import('./courses/ssc-rakesh-maths.json') as any,
  'ssc-ranjan-maths': () => import('./courses/ssc-ranjan-maths.json') as any,
  'ssc-tarun-english': () => import('./courses/ssc-tarun-english.json') as any,
  'ssc-vikram-reasoning': () => import('./courses/ssc-vikram-reasoning.json') as any,
};

export function getCourseById(id: string): Course | undefined {
  if (!id) return undefined;
  return courseDetailsCache.get(id) || INITIAL_COURSES.find((c) => c.id === id);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  if (!categoryId || categoryId === 'all') return INITIAL_COURSES;
  return INITIAL_COURSES.filter((c) => (c.category || '').toLowerCase() === categoryId.toLowerCase());
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
