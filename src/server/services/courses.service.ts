import 'server-only';
import {
  getAllCourses,
  findCourseById,
  findCoursesByCategory,
} from '@/server/repositories/course.repo';
import { NotFoundError } from '@/server/http/errors';
import type { Course } from '@/types';

export async function listCoursesCatalog(category?: string): Promise<Course[]> {
  if (category && category !== 'all') {
    return findCoursesByCategory(category);
  }
  return getAllCourses();
}

export async function getCourseDetailById(courseId: string): Promise<Course> {
  const course = await findCourseById(courseId);
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  return course;
}
