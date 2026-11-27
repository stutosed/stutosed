import { z } from 'zod';

export const coursesListQuerySchema = z.object({
  category: z.string().max(64).optional(),
});

export const courseParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid course ID'),
});

export type CoursesListQuery = z.infer<typeof coursesListQuerySchema>;
export type CourseParams = z.infer<typeof courseParamsSchema>;
