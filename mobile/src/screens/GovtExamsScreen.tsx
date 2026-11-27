import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course } from '../types';
import { useTheme } from '../context/ThemeContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import {
  INITIAL_COURSES,
  countCourseStats,
  isGovernmentCategory,
} from '../data/coursesData';
import { spacing, radii } from '../theme/spacing';
import {
  Landmark,
  Calculator,
  BookOpen,
  Brain,
  Globe,
  Monitor,
  Trophy,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Video,
  FileText,
  Layers,
} from 'lucide-react-native';

type GovtDisciplineId =
  | 'banking'
  | 'maths'
  | 'english'
  | 'reasoning'
  | 'gk'
  | 'computer'
  | 'complete-ssc';

interface DisciplineDef {
  id: GovtDisciplineId;
  title: string;
  shortTitle: string;
  subjectMatches: string[];
  description: string;
  icon: typeof Landmark;
  accentColor: string;
  accentDim: string;
  featuredEducators: string[];
}

const GOVT_DISCIPLINES: DisciplineDef[] = [
  {
    id: 'banking',
    title: 'Banking Exams (IBPS, SBI, RBI, RRB)',
    shortTitle: 'Banking Exams',
    subjectMatches: ['Banking'],
    description:
      'SBI PO/Clerk, IBPS PO/Clerk, RRB, and RBI preparation with Complete Quantitative Aptitude & Speed Maths.',
    icon: Landmark,
    accentColor: '#0ea5e9',
    accentDim: 'rgba(14, 165, 233, 0.12)',
    featuredEducators: ['Aashish Arora Sir'],
  },
  {
    id: 'maths',
    title: 'Quantitative Aptitude / Mathematics',
    shortTitle: 'Mathematics',
    subjectMatches: ['Maths'],
    description:
      'Complete Arithmetic, Advanced Algebra, Geometry, Trigonometry, and Calculation Speed mastery.',
    icon: Calculator,
    accentColor: '#6366f1',
    accentDim: 'rgba(99, 102, 241, 0.12)',
    featuredEducators: ['Gagan Pratap Sir', 'Abhinay Sharma Sir'],
  },
  {
    id: 'english',
    title: 'English Language & Comprehension',
    shortTitle: 'English',
    subjectMatches: ['English'],
    description:
      'Comprehensive Grammar rules, Vocabulary flashcards, Cloze tests, and Reading Comprehension.',
    icon: BookOpen,
    accentColor: '#10b981',
    accentDim: 'rgba(16, 185, 129, 0.12)',
    featuredEducators: ['Gopal Verma Sir'],
  },
  {
    id: 'reasoning',
    title: 'General Intelligence & Reasoning',
    shortTitle: 'Reasoning',
    subjectMatches: ['Reasoning'],
    description:
      'Verbal, Non-Verbal, Analytical puzzles, Syllogisms, Critical thinking, and Speed test series.',
    icon: Brain,
    accentColor: '#f59e0b',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    featuredEducators: ['Piyush Varshney Sir'],
  },
  {
    id: 'gk',
    title: 'General Studies (GK/GS)',
    shortTitle: 'General Studies (GK/GS)',
    subjectMatches: ['General Knowledge'],
    description:
      'Static GK, General Science, Indian History, Polity, Geography, and Revision lectures.',
    icon: Globe,
    accentColor: '#06b6d4',
    accentDim: 'rgba(6, 182, 212, 0.12)',
    featuredEducators: ['Parmar Sir'],
  },
  {
    id: 'computer',
    title: 'Computer Awareness & Special',
    shortTitle: 'Computer Awareness',
    subjectMatches: ['Computer'],
    description:
      'Computer fundamentals, hardware/software, networking, MS Office, and SSC qualifying syllabus.',
    icon: Monitor,
    accentColor: '#3b82f6',
    accentDim: 'rgba(59, 130, 246, 0.12)',
    featuredEducators: ['Yatendra Sir'],
  },
  {
    id: 'complete-ssc',
    title: 'Complete SSC / Combined Batches',
    shortTitle: 'Combined Batches',
    subjectMatches: ['SSC Complete'],
    description:
      'All 4 Subjects (Maths + English + Reasoning + GS) bundled in integrated, exam-targeted programs.',
    icon: Trophy,
    accentColor: '#8b5cf6',
    accentDim: 'rgba(139, 92, 246, 0.12)',
    featuredEducators: ['Multiple Teachers', 'SSC Faculty'],
  },
];

function matchCourseDiscipline(course: Course, def: DisciplineDef): boolean {
  const subj = (course.subject || '').toLowerCase();
  const hay = `${course.name} ${course.subname || ''} ${course.subject || ''}`.toLowerCase();
  if (def.subjectMatches.some((m) => subj.includes(m.toLowerCase()))) {
    return true;
  }
  if (def.id === 'banking') return hay.includes('banking') || hay.includes('quant hero');
  if (def.id === 'maths') return hay.includes('math');
  if (def.id === 'english') return hay.includes('english') || hay.includes('vocab');
  if (def.id === 'reasoning') return hay.includes('reasoning');
  if (def.id === 'gk') return hay.includes('parmar') || hay.includes('gk');
  if (def.id === 'computer') return hay.includes('computer');
  if (def.id === 'complete-ssc') return hay.includes('ssc') || hay.includes('selection') || hay.includes('aarambh');
  return false;
}

export const GovtExamsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const [selectedDiscipline, setSelectedDiscipline] = useState<GovtDisciplineId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const layerSlideX = useRef(new Animated.Value(0)).current;
  const layerOpacity = useRef(new Animated.Value(1)).current;

  const animateLayerTransition = useCallback(
    (direction: 'forward' | 'back') => {
      const startX = direction === 'forward' ? 28 : -28;
      layerSlideX.setValue(startX);
      layerOpacity.setValue(0.35);
      Animated.parallel([
        Animated.timing(layerSlideX, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(layerOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [layerSlideX, layerOpacity]
  );

  const openDiscipline = (id: GovtDisciplineId) => {
    setSelectedDiscipline(id);
    setSelectedTeacher('All');
    setSearchQuery('');
    animateLayerTransition('forward');
  };

  const stepBackToDisciplines = useCallback(() => {
    setSelectedDiscipline(null);
    setSelectedTeacher('All');
    setSearchQuery('');
    animateLayerTransition('back');
  }, [animateLayerTransition]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedDiscipline !== null) {
          stepBackToDisciplines();
          return true;
        }
        if (searchQuery.trim().length > 0) {
          setSearchQuery('');
          animateLayerTransition('back');
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [selectedDiscipline, searchQuery, stepBackToDisciplines, animateLayerTransition])
  );

  const govtCourses = useMemo(
    () => INITIAL_COURSES.filter((c) => isGovernmentCategory(c.category)),
    []
  );

  const activeDef = useMemo(
    () => GOVT_DISCIPLINES.find((d) => d.id === selectedDiscipline) || null,
    [selectedDiscipline]
  );

  const disciplineCourses = useMemo(() => {
    if (!activeDef) return [];
    return govtCourses.filter((c) => matchCourseDiscipline(c, activeDef));
  }, [govtCourses, activeDef]);

  const facultyList = useMemo(() => {
    const teachers = new Set<string>();
    disciplineCourses.forEach((c) => {
      if (c.teacher) teachers.add(c.teacher);
    });
    return ['All', ...Array.from(teachers)];
  }, [disciplineCourses]);

  const visibleCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const pool = activeDef ? disciplineCourses : govtCourses;
    return pool.filter((c) => {
      if (activeDef && selectedTeacher !== 'All' && c.teacher !== selectedTeacher) {
        return false;
      }
      if (!q) return true;
      const hay = `${c.name} ${c.subname || ''} ${c.teacher || ''} ${c.subject || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeDef, disciplineCourses, govtCourses, selectedTeacher, searchQuery]);

  const { refreshControl } = usePullToRefresh();

  const openCourse = (course: Course) => {
    navigation.navigate('CourseDetail', {
      courseId: course.id,
      title: course.name,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <Animated.View
          style={{
            opacity: layerOpacity,
            transform: [{ translateX: layerSlideX }],
          }}
        >
          {/* Top Breadcrumb Navigation */}
          {activeDef ? (
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity style={styles.backLinkBtn} onPress={stepBackToDisciplines}>
                <ArrowLeft size={14} color={colors.accent} />
                <Text style={[styles.backLinkText, { color: colors.accent }]}>
                  All Disciplines
                </Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textDim }}>/</Text>
              <Text style={[styles.breadcrumbCurrent, { color: colors.textMuted }]} numberOfLines={1}>
                {activeDef.shortTitle}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.backLinkBtn}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' });
                }
              }}
            >
              <ArrowLeft size={14} color={colors.accent} />
              <Text style={[styles.backLinkText, { color: colors.accent }]}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Section Header */}
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.headerIconBox,
                {
                  backgroundColor: activeDef ? activeDef.accentDim : colors.govtDim,
                },
              ]}
            >
              {activeDef ? (
                <activeDef.icon size={22} color={activeDef.accentColor} />
              ) : (
                <Landmark size={22} color={colors.govtIndigo} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                {activeDef ? activeDef.title : 'Government Exam Section'}
              </Text>
              <Text style={[styles.pageSub, { color: colors.textMuted }]}>
                {activeDef
                  ? activeDef.description
                  : 'Select a subject folder or search across SSC CGL, CHSL, Railway & Banking batches.'}
              </Text>
            </View>
          </View>

          {/* Search Input */}
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Search size={16} color={colors.textDim} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                activeDef
                  ? `Search inside ${activeDef.shortTitle}...`
                  : 'Search all govt batches, educators...'
              }
              placeholderTextColor={colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textDim} />
              </TouchableOpacity>
            )}
          </View>

          {/* LEVEL 1: DISCIPLINE FOLDER HUB */}
          {!activeDef && searchQuery.trim().length === 0 ? (
            <View style={styles.foldersList}>
              {GOVT_DISCIPLINES.map((def) => {
                const matching = govtCourses.filter((c) => matchCourseDiscipline(c, def));
                const totalVids = matching.reduce((acc, c) => acc + countCourseStats(c).videos, 0);
                const totalRes = matching.reduce((acc, c) => acc + countCourseStats(c).resources, 0);
                const IconComp = def.icon;

                return (
                  <TouchableOpacity
                    key={def.id}
                    style={[
                      styles.folderCard,
                      { backgroundColor: colors.bgCard, borderColor: colors.border },
                    ]}
                    onPress={() => openDiscipline(def.id)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.folderTopRow}>
                      <View style={[styles.folderIconBox, { backgroundColor: def.accentDim }]}>
                        <IconComp size={22} color={def.accentColor} />
                      </View>
                      <View style={[styles.batchCountPill, { backgroundColor: def.accentDim }]}>
                        <Layers size={12} color={def.accentColor} />
                        <Text style={[styles.batchCountText, { color: def.accentColor }]}>
                          {matching.length} {matching.length === 1 ? 'Batch' : 'Batches'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.folderTitle, { color: colors.text }]}>{def.title}</Text>
                    <Text style={[styles.folderDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {def.description}
                    </Text>

                    <View style={[styles.folderFooter, { borderTopColor: colors.borderSubtle }]}>
                      <View style={styles.folderStatsRow}>
                        <View style={styles.folderStat}>
                          <Video size={12} color={colors.textDim} />
                          <Text style={[styles.folderStatText, { color: colors.textDim }]}>
                            {totalVids} Videos
                          </Text>
                        </View>
                        {totalRes > 0 && (
                          <View style={styles.folderStat}>
                            <FileText size={12} color={colors.textDim} />
                            <Text style={[styles.folderStatText, { color: colors.textDim }]}>
                              {totalRes} PDFs
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.folderExplore}>
                        <Text style={[styles.folderExploreText, { color: def.accentColor }]}>
                          Open Folder
                        </Text>
                        <ArrowRight size={14} color={def.accentColor} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* LEVEL 2 OR SEARCH RESULTS: BATCH CARDS + FACULTY FILTER CHIPS */
            <View>
              {activeDef && facultyList.length > 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.facultyRow}
                >
                  {facultyList.map((teacher) => {
                    const active = selectedTeacher === teacher;
                    return (
                      <TouchableOpacity
                        key={teacher}
                        style={[
                          styles.facultyChip,
                          {
                            backgroundColor: active ? activeDef.accentColor : colors.bgCard,
                            borderColor: active ? activeDef.accentColor : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedTeacher(teacher)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.facultyChipText,
                            { color: active ? '#ffffff' : colors.textMuted },
                          ]}
                        >
                          {teacher}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {visibleCourses.length > 0 ? (
                visibleCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onPress={() => openCourse(course)}
                  />
                ))
              ) : (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No batches found matching your filter.
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    marginBottom: 8,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  foldersList: {
    gap: 12,
  },
  folderCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  folderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  folderIconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  batchCountText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  folderTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  folderDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  folderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  folderStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderStatText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  folderExplore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderExploreText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  facultyRow: {
    gap: 8,
    paddingBottom: 14,
  },
  facultyChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  facultyChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13.5,
  },
});
