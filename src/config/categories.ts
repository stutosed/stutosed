export interface CategoryConfig {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  iconName: 'Landmark' | 'GraduationCap' | 'Atom' | 'Cpu' | 'BookOpen' | 'Scale' | 'Layers';
  accentColor: string;
  accentDim: string;
  badge?: string;
  isUpcoming?: boolean;
}

export const COURSE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'government',
    label: 'Government Exams',
    shortLabel: 'Govt Exams',
    description: 'Comprehensive syllabus courses for SSC CGL, CHSL, MTS, Railway, and State Government examinations.',
    iconName: 'Landmark',
    accentColor: '#6366f1',
    accentDim: 'rgba(99, 102, 241, 0.12)',
    badge: 'Popular',
  },
  {
    id: 'gate',
    label: 'GATE Engineering',
    shortLabel: 'GATE Engineering',
    description: 'Graduate Aptitude Test in Engineering preparation for ECE and core technical engineering subjects.',
    iconName: 'Cpu',
    accentColor: '#f59e0b',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    badge: 'ECE Ready',
  },
];

export function getCategoryById(id: string): CategoryConfig | undefined {
  return COURSE_CATEGORIES.find((cat) => cat.id.toLowerCase() === id.toLowerCase());
}

export function getAllCategories(): CategoryConfig[] {
  return COURSE_CATEGORIES;
}
