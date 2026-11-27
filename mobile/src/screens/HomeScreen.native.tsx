import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  AppState,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, LectureItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { FadeInView } from '../components/FadeInView';
import {
  INITIAL_COURSES,
  getCourseById,
  loadCourseDetails,
  countCourseStats,
  isGovernmentCategory,
  getTotalStats,
} from '../data/coursesData';
import {
  loadStudyMinutesToday,
  incrementStudyMinutesToday,
  computeDashboardMetrics,
  formatStudyDuration,
} from '../lib/nativeStudyTracker';
import { spacing, radii } from '../theme/spacing';
import {
  Flame,
  Play,
  Clock,
  CheckCircle2,
  Target,
  BookmarkCheck,
  FileText,
  History,
  Landmark,
  Cpu,
  ArrowRight,
  BookOpen,
} from 'lucide-react-native';

function getGreetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function extractCourseLectureItems(course: Course): { item: LectureItem; tabId: string }[] {
  const out: { item: LectureItem; tabId: string }[] = [];
  if (course.tabs && course.tabs.length > 0) {
    for (const tab of course.tabs) {
      for (const item of tab.items || []) {
        out.push({ item, tabId: tab.id });
      }
    }
    return out;
  }
  if (course.isParmar && course.parmarData) {
    for (const [subjKey, subj] of Object.entries(course.parmarData)) {
      subj.lectures.forEach((lec, idx) => {
        const url = lec.links?.url || '';
        out.push({
          tabId: subjKey,
          item: {
            id: `${course.id}-${subjKey}-${idx}`,
            label: lec.title,
            url,
            type: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'external',
            links: lec.links,
            subject: subjKey,
          },
        });
      });
    }
    return out;
  }
  if (course.isPratham && course.prathamBySubject) {
    for (const [subjKey, list] of Object.entries(course.prathamBySubject)) {
      for (const item of list) {
        out.push({ item, tabId: subjKey });
      }
    }
  }
  return out;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const {
    user,
    isLoading,
    watchedMap,
    bookmarks,
    lastPlayed,
    refreshSessionAndSync,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [studyMinutesToday, setStudyMinutesToday] = useState(0);
  const [dailyMinutesMap, setDailyMinutesMap] = useState<Record<string, number>>({});
  const [resumeCourseDetails, setResumeCourseDetails] = useState<Course | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    );
    if (isLoading || hydrating) {
      loop.start();
    } else {
      loop.stop();
    }
    return () => loop.stop();
  }, [isLoading, hydrating, pulseAnim]);

  // Track real active study minutes locally on native every 60s
  useEffect(() => {
    loadStudyMinutesToday().then(({ todayMinutes, dailyMinutes }) => {
      setStudyMinutesToday(todayMinutes);
      setDailyMinutesMap(dailyMinutes);
    });

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        incrementStudyMinutesToday(1).then((updated) => {
          setStudyMinutesToday(updated);
          setDailyMinutesMap((prev) => {
            const d = new Date();
            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
              d.getDate()
            ).padStart(2, '0')}`;
            return { ...prev, [k]: updated };
          });
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const studyState = await loadStudyMinutesToday();
      setStudyMinutesToday(studyState.todayMinutes);
      setDailyMinutesMap(studyState.dailyMinutes);

      if (lastPlayed?.courseId) {
        const detailed = await loadCourseDetails(lastPlayed.courseId);
        setResumeCourseDetails(detailed);
      } else {
        setResumeCourseDetails(null);
      }
    } finally {
      setHydrating(false);
    }
  }, [lastPlayed?.courseId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshSessionAndSync(), loadDashboardData()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSessionAndSync, loadDashboardData]);

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Advik';
  const firstName = userName.split(' ')[0];
  const initials = getInitials(userName);

  const metrics = useMemo(
    () => computeDashboardMetrics(watchedMap, dailyMinutesMap),
    [watchedMap, dailyMinutesMap]
  );

  const totalCatalogStats = useMemo(() => getTotalStats(), []);

  const govtBatchesCount = useMemo(
    () => INITIAL_COURSES.filter((c) => isGovernmentCategory(c.category)).length,
    []
  );

  const gateCourse = useMemo(
    () => getCourseById('gate-ece-made-easy-signal-system'),
    []
  );
  const gateLectureCount = gateCourse ? countCourseStats(gateCourse).videos : 36;

  // Resume Lecture computed metrics (real course progress %)
  const lastPlayedCourse = useMemo(() => {
    if (!lastPlayed?.courseId) return null;
    return resumeCourseDetails || getCourseById(lastPlayed.courseId) || null;
  }, [lastPlayed?.courseId, resumeCourseDetails]);

  const resumeProgress = useMemo(() => {
    if (!lastPlayedCourse) return { pct: 0, watched: 0, total: 0, matchedLecture: null as LectureItem | null };
    const entries = extractCourseLectureItems(lastPlayedCourse);
    const totalFromCourse = countCourseStats(lastPlayedCourse).videos || entries.length;

    let matchedLecture: LectureItem | null = null;
    let watchedInCourse = 0;

    for (const entry of entries) {
      const k1 = entry.item.url || '';
      const k2 = entry.item.links?.url || '';
      const k3 = entry.item.id || '';
      if (
        (lastPlayed?.url && (k1 === lastPlayed.url || k2 === lastPlayed.url || k3 === lastPlayed.url)) ||
        (lastPlayed?.lectureTitle && entry.item.label === lastPlayed.lectureTitle)
      ) {
        matchedLecture = entry.item;
      }
      if ((k1 && watchedMap[k1]) || (k2 && watchedMap[k2]) || (k3 && watchedMap[k3])) {
        watchedInCourse++;
      }
    }

    const total = Math.max(totalFromCourse, watchedInCourse, 1);
    const pct = Math.min(100, Math.round((watchedInCourse / total) * 100));
    return { pct, watched: watchedInCourse, total: totalFromCourse || entries.length, matchedLecture };
  }, [lastPlayedCourse, lastPlayed?.url, lastPlayed?.lectureTitle, watchedMap]);

  const handleResumePress = () => {
    if (!lastPlayed || !lastPlayedCourse) {
      (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' });
      return;
    }
    if (resumeProgress.matchedLecture) {
      navigation.navigate('Watch', {
        lecture: resumeProgress.matchedLecture,
        courseId: lastPlayedCourse.id,
        courseTitle: lastPlayedCourse.name,
        tabId: lastPlayed.tabId,
      });
    } else {
      navigation.navigate('CourseDetail', {
        courseId: lastPlayedCourse.id,
        title: lastPlayedCourse.name,
      });
    }
  };

  const firstPdfCourse = useMemo(
    () =>
      INITIAL_COURSES.find((c) => countCourseStats(c).resources > 0) ||
      INITIAL_COURSES[0],
    []
  );

  const resumeThumbUri =
    resumeProgress.matchedLecture?.thumb?.startsWith('http')
      ? resumeProgress.matchedLecture.thumb
      : lastPlayedCourse?.thumb?.startsWith('http')
      ? lastPlayedCourse.thumb
      : undefined;

  const showSkeleton = isLoading || hydrating;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* 1. COMPACT GREETING ROW (Full width, clean one-line feel) */}
        <FadeInView delay={0}>
          <View style={styles.greetingRow}>
            <View
              style={[
                styles.greetingAvatar,
                {
                  backgroundColor: user?.avatar_url ? 'transparent' : colors.accent,
                  borderColor: colors.border,
                },
              ]}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.greetingAvatarImg} />
              ) : (
                <Text style={styles.greetingAvatarText}>{initials}</Text>
              )}
            </View>
            <Text style={[styles.greetingText, { color: colors.text }]}>
              {getGreetingPrefix()}, {firstName}
            </Text>
          </View>
        </FadeInView>

        {/* 2. ONE ROW, TWO COLUMNS: BIG STREAK SQUARE BOX + TODAY'S STUDY STATS COLUMN */}
        <FadeInView delay={55}>
          <View style={styles.bentoRow}>
          {/* Column 1: Big Static Square Streak Box */}
          <View
            style={[
              styles.streakSquareCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.streakIconOrb,
                { backgroundColor: 'rgba(204, 120, 92, 0.12)', borderColor: 'rgba(204, 120, 92, 0.25)' },
              ]}
            >
              <Flame
                size={24}
                color={colors.accent}
                fill={metrics.streakDays > 0 ? colors.accent : 'transparent'}
              />
            </View>
            <Text style={[styles.streakBigNumber, { color: colors.text }]}>
              {metrics.streakDays}
            </Text>
            <Text style={[styles.streakBoxLabel, { color: colors.accent }]}>Day Streak</Text>
            <Text style={[styles.streakBoxHint, { color: colors.textDim }]} numberOfLines={1}>
              {metrics.streakDays > 0 ? 'Active study streak' : 'Watch 1 lecture today'}
            </Text>
          </View>

          {/* Column 2: Study Duration & Progress Stats */}
          <View
            style={[
              styles.statsColumnCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.statLineItem}>
              <View style={[styles.statLineIcon, { backgroundColor: 'rgba(204, 120, 92, 0.12)' }]}>
                <Clock size={14} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLineLabel, { color: colors.textDim }]}>
                  Studied Today
                </Text>
                <Text style={[styles.statLineValue, { color: colors.text }]}>
                  {formatStudyDuration(studyMinutesToday)}
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statLineItem}>
              <View style={[styles.statLineIcon, { backgroundColor: colors.greenDim }]}>
                <CheckCircle2 size={14} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLineLabel, { color: colors.textDim }]}>
                  Lectures Done
                </Text>
                <Text style={[styles.statLineValue, { color: colors.text }]}>
                  {metrics.lecturesToday} today • {metrics.totalWatched} total
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statLineItem}>
              <View style={[styles.statLineIcon, { backgroundColor: colors.govtDim }]}>
                <Target size={14} color={colors.govtIndigo} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.goalHeaderRow}>
                  <Text style={[styles.statLineLabel, { color: colors.textDim }]}>
                    Weekly Goal
                  </Text>
                  <Text style={[styles.goalPctText, { color: colors.govtIndigo }]}>
                    {metrics.weeklyGoalPct}%
                  </Text>
                </View>
                <View style={[styles.goalTrack, { backgroundColor: colors.bgCardSubtle }]}>
                  <View
                    style={[
                      styles.goalFill,
                      {
                        backgroundColor: colors.govtIndigo,
                        width: `${Math.max(metrics.weeklyGoalPct, metrics.weeklyGoalPct > 0 ? 5 : 0)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        </FadeInView>

        {/* 3. COMPACT TRACKS (Two small side-by-side tiles: Icon + Name + Count only) */}
        <FadeInView delay={110}>
          <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tracks</Text>
          <View style={styles.tracksGrid}>
            <TouchableOpacity
              style={[
                styles.trackTile,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('GovtExams')}
              activeOpacity={0.82}
            >
              <View style={[styles.trackIconBox, { backgroundColor: colors.govtDim }]}>
                <Landmark size={18} color={colors.govtIndigo} />
              </View>
              <View style={styles.trackTextWrap}>
                <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
                  Government Exams
                </Text>
                <Text style={[styles.trackCount, { color: colors.govtIndigo }]}>
                  {govtBatchesCount} Batches
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trackTile,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('Gate')}
              activeOpacity={0.82}
            >
              <View style={[styles.trackIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Cpu size={18} color="#f59e0b" />
              </View>
              <View style={styles.trackTextWrap}>
                <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
                  GATE ECE
                </Text>
                <Text style={[styles.trackCount, { color: '#d97706' }]}>
                  {gateLectureCount} Lectures
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        </FadeInView>

        {/* 4. RESUME LECTURE CARD (Last Viewed Lecture) OR SKELETON / EMPTY STATE */}
        <FadeInView delay={165}>
        {showSkeleton ? (
          <Animated.View
            style={[
              styles.skeletonCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border, opacity: pulseAnim },
            ]}
          >
            <View style={[styles.skeletonThumb, { backgroundColor: colors.bgCardSubtle }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.skeletonLine, { width: '45%', backgroundColor: colors.bgCardSubtle }]} />
              <View style={[styles.skeletonLine, { width: '85%', height: 14, backgroundColor: colors.bgCardSubtle }]} />
              <View style={[styles.skeletonLine, { width: '100%', height: 6, backgroundColor: colors.bgCardSubtle }]} />
            </View>
          </Animated.View>
        ) : lastPlayed && lastPlayedCourse ? (
          <TouchableOpacity
            style={[
              styles.resumeCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={handleResumePress}
            activeOpacity={0.85}
          >
            <View style={styles.resumeTopRow}>
              {resumeThumbUri ? (
                <Image source={{ uri: resumeThumbUri }} style={styles.resumeThumb} />
              ) : (
                <View
                  style={[
                    styles.resumeThumbPlaceholder,
                    { backgroundColor: 'rgba(204, 120, 92, 0.12)', borderColor: colors.border },
                  ]}
                >
                  <BookOpen size={22} color={colors.accent} />
                </View>
              )}

              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeBatch, { color: colors.accent }]} numberOfLines={1}>
                  {lastPlayedCourse.name}
                </Text>
                <Text style={[styles.resumeLectureTitle, { color: colors.text }]} numberOfLines={2}>
                  {lastPlayed.lectureTitle || lastPlayedCourse.name}
                </Text>
              </View>

              <View style={[styles.resumePlayBtn, { backgroundColor: colors.accent }]}>
                <Play size={16} color="#ffffff" fill="#ffffff" />
              </View>
            </View>

            <View style={styles.progressBlock}>
              <View style={[styles.progressTrack, { backgroundColor: colors.bgCardSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.accent,
                      width: `${Math.max(resumeProgress.pct, resumeProgress.watched > 0 ? 4 : 0)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                {resumeProgress.pct}% ({resumeProgress.watched}/{resumeProgress.total})
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.emptyResumeCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' })}
            activeOpacity={0.85}
          >
            <View style={[styles.emptyPlayCircle, { backgroundColor: 'rgba(204, 120, 92, 0.12)' }]}>
              <Play size={18} color={colors.accent} fill={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Start your first lecture
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]} numberOfLines={2}>
                Pick a batch from Courses to track daily progress and resume anytime.
              </Text>
            </View>
            <ArrowRight size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
        </FadeInView>

        {/* 5. QUICK ACCESS HORIZONTAL ROW */}
        <FadeInView delay={220}>
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick Access</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAccessScroll}
          >
            <TouchableOpacity
              style={[
                styles.quickTile,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'LibraryTab' })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: 'rgba(204, 120, 92, 0.12)' }]}>
                <BookmarkCheck size={16} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>Bookmarks</Text>
                <Text style={[styles.quickSub, { color: colors.textDim }]}>
                  {bookmarks.length} saved
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickTile,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => {
                if (firstPdfCourse) {
                  navigation.navigate('CourseDetail', {
                    courseId: firstPdfCourse.id,
                    title: firstPdfCourse.name,
                  });
                } else {
                  (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' });
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: colors.govtDim }]}>
                <FileText size={16} color={colors.govtIndigo} />
              </View>
              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>Notes &amp; PDFs</Text>
                <Text style={[styles.quickSub, { color: colors.textDim }]}>
                  {totalCatalogStats.totalPDFs} resources
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickTile,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'LibraryTab' })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconBox, { backgroundColor: colors.greenDim }]}>
                <History size={16} color={colors.green} />
              </View>
              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>Watched</Text>
                <Text style={[styles.quickSub, { color: colors.textDim }]}>
                  {metrics.totalWatched} lectures
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  greetingAvatarImg: {
    width: '100%',
    height: '100%',
  },
  greetingAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  skeletonThumb: {
    width: 68,
    height: 68,
    borderRadius: radii.lg,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
  },
  resumeCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resumeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeThumb: {
    width: 66,
    height: 66,
    borderRadius: radii.md,
    backgroundColor: '#1a1917',
  },
  resumeThumbPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  resumeBatch: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resumeLectureTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  resumePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyResumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 16,
  },
  emptyPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 12,
    lineHeight: 17,
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  streakSquareCard: {
    width: '44%',
    aspectRatio: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  streakIconOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  streakBigNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  streakBoxLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  streakBoxHint: {
    fontSize: 10.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsColumnCard: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statLineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  statLineIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLineLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statLineValue: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 1,
  },
  statDivider: {
    height: 1,
    marginVertical: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  quickAccessScroll: {
    gap: 10,
    paddingRight: 4,
  },
  quickTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  quickIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  tracksGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  trackTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  trackIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  trackName: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackCount: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
});
