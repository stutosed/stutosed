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
  Video,
  ArrowRight,
  BookOpen,
} from 'lucide-react-native';

interface RecentFeedItem {
  key: string;
  lecture: LectureItem;
  courseId: string;
  courseName: string;
  thumb?: string;
  isPdf: boolean;
}

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
    markLectureWatched,
    recordCourseMemory,
    refreshSessionAndSync,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [studyMinutesToday, setStudyMinutesToday] = useState(0);
  const [dailyMinutesMap, setDailyMinutesMap] = useState<Record<string, number>>({});
  const [resumeCourseDetails, setResumeCourseDetails] = useState<Course | null>(null);
  const [recentFeed, setRecentFeed] = useState<RecentFeedItem[]>([]);

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

      const feedCourseIds = [
        'banking-quant-hero',
        'gate-ece-made-easy-signal-system',
        'parmar',
      ];
      const loadedCourses = await Promise.all(
        feedCourseIds.map((id) => loadCourseDetails(id))
      );

      const feedItems: RecentFeedItem[] = [];
      for (const course of loadedCourses) {
        if (!course) continue;
        const entries = extractCourseLectureItems(course);
        const videoEntries = entries
          .filter((e) => e.item.type !== 'pdf' && e.item.category !== 'pdfs')
          .slice(0, 3);
        const pdfEntries = entries
          .filter((e) => e.item.type === 'pdf' || e.item.category === 'pdfs')
          .slice(0, 1);

        for (const entry of [...videoEntries, ...pdfEntries]) {
          const thumbCandidate =
            (entry.item.thumb && entry.item.thumb.startsWith('http')
              ? entry.item.thumb
              : undefined) ||
            (course.thumb && course.thumb.startsWith('http') ? course.thumb : undefined);

          feedItems.push({
            key: `${course.id}-${entry.item.id || entry.item.label}`,
            lecture: entry.item,
            courseId: course.id,
            courseName: course.name,
            thumb: thumbCandidate,
            isPdf: entry.item.type === 'pdf' || entry.item.category === 'pdfs',
          });
        }
      }

      setRecentFeed(feedItems.slice(0, 10));
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

  const handleOpenRecentItem = (feedItem: RecentFeedItem) => {
    const key = feedItem.lecture.url || feedItem.lecture.links?.url || feedItem.lecture.id || feedItem.key;
    markLectureWatched(feedItem.courseId, key);
    recordCourseMemory({
      courseId: feedItem.courseId,
      courseName: feedItem.courseName,
      lectureTitle: feedItem.lecture.label,
      tabId: feedItem.lecture.subject || 'videos',
      url: key,
      timestamp: Date.now(),
    });
    navigation.navigate('Watch', {
      lecture: feedItem.lecture,
      courseId: feedItem.courseId,
      courseTitle: feedItem.courseName,
    });
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
        {/* 1. COMPACT GREETING ROW (One line, no big card) */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
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
            <Text style={[styles.greetingText, { color: colors.text }]} numberOfLines={1}>
              {getGreetingPrefix()}, {firstName}
            </Text>
          </View>

          <View
            style={[
              styles.streakChip,
              { backgroundColor: 'rgba(204, 120, 92, 0.12)', borderColor: 'rgba(204, 120, 92, 0.25)' },
            ]}
          >
            <Flame size={13} color={colors.accent} fill={metrics.streakDays > 0 ? colors.accent : 'transparent'} />
            <Text style={[styles.streakText, { color: colors.accent }]}>
              {metrics.streakDays} day streak
            </Text>
          </View>
        </View>

        {/* 2. RESUME LECTURE CARD (Top Priority) OR SKELETON / EMPTY STATE */}
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
              {/* Thumbnail */}
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

              {/* Details */}
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeBatch, { color: colors.accent }]} numberOfLines={1}>
                  {lastPlayedCourse.name}
                </Text>
                <Text style={[styles.resumeLectureTitle, { color: colors.text }]} numberOfLines={2}>
                  {lastPlayed.lectureTitle || lastPlayedCourse.name}
                </Text>
              </View>

              {/* Play Button */}
              <View style={[styles.resumePlayBtn, { backgroundColor: colors.accent }]}>
                <Play size={16} color="#ffffff" fill="#ffffff" />
              </View>
            </View>

            {/* Progress Bar + Percentage */}
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

        {/* 3. TODAY'S PROGRESS (3 small inline stat chips) */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statChip,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Clock size={14} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatStudyDuration(studyMinutesToday)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Studied</Text>
          </View>

          <View
            style={[
              styles.statChip,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <CheckCircle2 size={14} color={colors.green} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {metrics.lecturesToday}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Done today</Text>
          </View>

          <View
            style={[
              styles.statChip,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Target size={14} color={colors.govtIndigo} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {metrics.weeklyGoalPct}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Weekly goal</Text>
          </View>
        </View>

        {/* 4. QUICK ACCESS HORIZONTAL ROW (Real app features only) */}
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

        {/* 5. RECENTLY ADDED HORIZONTAL LIST */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: 0 }]}>
              Recently Added
            </Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' })}
            >
              <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {showSkeleton && recentFeed.length === 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {[1, 2, 3].map((idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.recentSkeletonCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border, opacity: pulseAnim },
                  ]}
                >
                  <View style={[styles.recentSkeletonThumb, { backgroundColor: colors.bgCardSubtle }]} />
                  <View style={[styles.skeletonLine, { width: '80%', marginTop: 10, backgroundColor: colors.bgCardSubtle }]} />
                  <View style={[styles.skeletonLine, { width: '50%', marginTop: 6, backgroundColor: colors.bgCardSubtle }]} />
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentFeed.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.recentCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                  ]}
                  onPress={() => handleOpenRecentItem(item)}
                  activeOpacity={0.82}
                >
                  {item.thumb ? (
                    <Image source={{ uri: item.thumb }} style={styles.recentThumb} />
                  ) : (
                    <View
                      style={[
                        styles.recentThumbFallback,
                        { backgroundColor: 'rgba(204, 120, 92, 0.1)' },
                      ]}
                    >
                      {item.isPdf ? (
                        <FileText size={22} color={colors.accent} />
                      ) : (
                        <Video size={22} color={colors.accent} />
                      )}
                    </View>
                  )}

                  <View style={styles.recentBody}>
                    <View style={styles.recentTypeRow}>
                      <View
                        style={[
                          styles.recentTypeBadge,
                          {
                            backgroundColor: item.isPdf
                              ? 'rgba(204, 120, 92, 0.12)'
                              : colors.govtDim,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.recentTypeText,
                            { color: item.isPdf ? colors.accent : colors.govtIndigo },
                          ]}
                        >
                          {item.isPdf ? 'PDF' : 'Lecture'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.lecture.label}
                    </Text>
                    <Text style={[styles.recentBatch, { color: colors.textDim }]} numberOfLines={1}>
                      {item.courseName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 6. COMPACT TRACKS (Two small side-by-side tiles: Icon + Name + Count only) */}
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
    gap: 18,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
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
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11.5,
    fontWeight: '700',
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
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
  recentScroll: {
    gap: 12,
    paddingRight: 4,
  },
  recentSkeletonCard: {
    width: 176,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 10,
  },
  recentSkeletonThumb: {
    width: '100%',
    height: 88,
    borderRadius: radii.md,
  },
  recentCard: {
    width: 182,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentThumb: {
    width: '100%',
    height: 92,
    backgroundColor: '#1a1917',
  },
  recentThumbFallback: {
    width: '100%',
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBody: {
    padding: 10,
    gap: 4,
  },
  recentTypeRow: {
    flexDirection: 'row',
  },
  recentTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  recentTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recentTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  recentBatch: {
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
