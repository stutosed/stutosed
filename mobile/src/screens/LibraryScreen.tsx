import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import {
  getCourseById,
  resolveWatchedLecturesMap,
  WatchedLectureMatch,
} from '../data/coursesData';
import { triggerSmoothLayout } from '../lib/layoutAnim';
import { spacing, radii } from '../theme/spacing';
import {
  BookmarkCheck,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  ArrowLeft,
  FolderHeart,
  Play,
} from 'lucide-react-native';

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const {
    user,
    isSyncing,
    watchedMap,
    bookmarks,
    lastPlayed,
    refreshSessionAndSync,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [watchedLookup, setWatchedLookup] = useState<Record<string, WatchedLectureMatch>>({});

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshSessionAndSync();
      }
    }, [user?.id, refreshSessionAndSync])
  );

  const watchedEntries = useMemo(
    () => Object.entries(watchedMap).sort((a, b) => Number(b[1]) - Number(a[1])),
    [watchedMap]
  );

  useEffect(() => {
    let active = true;
    const keys = Object.keys(watchedMap);
    if (keys.length === 0) {
      setWatchedLookup({});
      return;
    }
    resolveWatchedLecturesMap(keys).then((resolved) => {
      if (active) setWatchedLookup(resolved);
    });
    return () => {
      active = false;
    };
  }, [watchedMap]);
  const bookmarkedCourses = useMemo(
    () =>
      bookmarks
        .map((id) => getCourseById(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [bookmarks]
  );

  const lastPlayedCourse = useMemo(
    () => (lastPlayed?.courseId ? getCourseById(lastPlayed.courseId) || null : null),
    [lastPlayed]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Row & Sync */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <ArrowLeft size={15} color={colors.text} />
            <Text style={[styles.backBtnText, { color: colors.text }]}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.syncBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={refreshSessionAndSync}
            disabled={isSyncing}
          >
            <RefreshCw size={14} color={colors.accent} />
            <Text style={[styles.syncBtnText, { color: colors.textMuted }]}>
              {isSyncing ? 'Syncing...' : user ? 'Synced' : 'Local'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Header matching LibraryView.tsx */}
        <View style={styles.titleBlock}>
          <View style={styles.libraryBadge}>
            <BookmarkCheck size={13} color={colors.accent} />
            <Text style={[styles.libraryBadgeText, { color: colors.accent }]}>
              Personalized Learning Hub
            </Text>
          </View>
          <Text style={[styles.mainTitle, { color: colors.text }]}>My Study Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your bookmarked batches and watched lectures are automatically organized here.
          </Text>
        </View>

        {/* Primary Tab Switcher matching .library-tabs-dock */}
        <View
          style={[
            styles.tabsDock,
            { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'bookmarks' && {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              if (activeTab !== 'bookmarks') {
                triggerSmoothLayout();
                setActiveTab('bookmarks');
              }
            }}
            activeOpacity={0.8}
          >
            <BookmarkCheck
              size={15}
              color={activeTab === 'bookmarks' ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'bookmarks' ? colors.text : colors.textMuted },
              ]}
            >
              Bookmarked Batches
            </Text>
            <View
              style={[
                styles.countTag,
                {
                  backgroundColor:
                    activeTab === 'bookmarks' ? 'rgba(204,120,92,0.15)' : colors.bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.countTagText,
                  { color: activeTab === 'bookmarks' ? colors.accent : colors.textDim },
                ]}
              >
                {bookmarkedCourses.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'history' && {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              if (activeTab !== 'history') {
                triggerSmoothLayout();
                setActiveTab('history');
              }
            }}
            activeOpacity={0.8}
          >
            <FolderHeart
              size={15}
              color={activeTab === 'history' ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'history' ? colors.text : colors.textMuted },
              ]}
            >
              Watched Activity
            </Text>
            <View
              style={[
                styles.countTag,
                {
                  backgroundColor:
                    activeTab === 'history' ? 'rgba(204,120,92,0.15)' : colors.bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.countTagText,
                  { color: activeTab === 'history' ? colors.accent : colors.textDim },
                ]}
              >
                {watchedEntries.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TAB 1: BOOKMARKED BATCHES */}
        {activeTab === 'bookmarks' && (
          <View>
            {bookmarkedCourses.length > 0 ? (
              bookmarkedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() =>
                    navigation.navigate('CourseDetail', {
                      courseId: course.id,
                      title: course.name,
                    })
                  }
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyStateCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.emptyIconCircle}>
                  <BookmarkCheck size={28} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Bookmarked Batches Yet
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Tap the bookmark icon on any batch card to pin your active courses here for
                  instant access.
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                  onPress={() => (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' })}
                  activeOpacity={0.85}
                >
                  <BookOpen size={15} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Explore All Batches</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: WATCHED ACTIVITY */}
        {activeTab === 'history' && (
          <View style={styles.historyList}>
            {lastPlayed && lastPlayedCourse && (
              <TouchableOpacity
                style={[
                  styles.resumeBanner,
                  { backgroundColor: colors.bgCard, borderColor: colors.accent },
                ]}
                onPress={() =>
                  navigation.navigate('CourseDetail', {
                    courseId: lastPlayedCourse.id,
                    title: lastPlayedCourse.name,
                  })
                }
                activeOpacity={0.82}
              >
                <View style={[styles.resumeIconBox, { backgroundColor: colors.accent }]}>
                  <Play size={15} color="#ffffff" fill="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resumeEyebrow, { color: colors.accent }]}>
                    LAST PLAYED LECTURE
                  </Text>
                  <Text style={[styles.resumeTitle, { color: colors.text }]} numberOfLines={1}>
                    {lastPlayed.lectureTitle || lastPlayedCourse.name}
                  </Text>
                  <Text style={[styles.resumeCourse, { color: colors.textMuted }]} numberOfLines={1}>
                    {lastPlayedCourse.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {watchedEntries.length > 0 ? (
              watchedEntries.slice(0, 30).map(([watchKey, timestamp]) => {
                const match = watchedLookup[watchKey];
                const cleanTitle = match?.label || 'Watched Lecture';
                return (
                  <TouchableOpacity
                    key={watchKey}
                    style={[
                      styles.historyRow,
                      { backgroundColor: colors.bgCard, borderColor: colors.border },
                    ]}
                    activeOpacity={match ? 0.78 : 1}
                    onPress={() => {
                      if (match) {
                        navigation.navigate('Watch', {
                          lecture: match.lecture,
                          courseId: match.courseId,
                          courseTitle: match.courseName,
                          tabId: match.tabId,
                        });
                      }
                    }}
                  >
                    <CheckCircle2 size={17} color={colors.green} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyLabel, { color: colors.text }]} numberOfLines={1}>
                        {cleanTitle}
                      </Text>
                      <Text style={[styles.historyTime, { color: colors.textDim }]} numberOfLines={1}>
                        {match?.courseName ? `${match.courseName} • ` : ''}
                        Completed {new Date(timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyStateCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.emptyIconCircle}>
                  <CheckCircle2 size={28} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Watched Lectures Yet
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Start watching any lecture and your completion progress will sync automatically.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleBlock: {
    marginBottom: 16,
  },
  libraryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(204,120,92,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 8,
  },
  libraryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  tabsDock: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 18,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  countTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  countTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyStateCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(204,120,92,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyList: {
    gap: 10,
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 4,
  },
  resumeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resumeCourse: {
    fontSize: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 11,
    marginTop: 2,
  },
});
