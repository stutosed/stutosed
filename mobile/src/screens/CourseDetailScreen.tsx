import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, LectureItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { loadCourseDetails } from '../data/coursesData';
import { LectureRow } from '../components/LectureRow';
import { ArrowLeft, User, BookOpen, Layers, Bookmark } from 'lucide-react-native';

type CourseDetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;

export const CourseDetailScreen: React.FC = () => {
  const route = useRoute<CourseDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const {
    watchedMap,
    bookmarks,
    toggleLectureWatched,
    markLectureWatched,
    recordCourseMemory,
    toggleCourseBookmark,
  } = useAuth();

  const { courseId, title } = route.params;
  const isBookmarked = bookmarks.includes(courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTabId, setSelectedTabId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    loadCourseDetails(courseId).then((data) => {
      if (isMounted) {
        setCourse(data);
        if (data?.tabs && data.tabs.length > 0) {
          setSelectedTabId(data.tabs[0].id);
        } else if (data?.isParmar && data.parmarData) {
          const firstKey = Object.keys(data.parmarData)[0];
          setSelectedTabId(firstKey || '');
        } else if (data?.isPratham && data.prathamBySubject) {
          const firstKey = Object.keys(data.prathamBySubject)[0];
          setSelectedTabId(firstKey || '');
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const tabs = useMemo(() => {
    if (!course) return [];
    if (course.tabs && course.tabs.length > 0) {
      return course.tabs.map((t) => ({ id: t.id, label: t.label }));
    }
    if (course.isParmar && course.parmarData) {
      return Object.keys(course.parmarData).map((k) => ({ id: k, label: k }));
    }
    if (course.isPratham && course.prathamBySubject) {
      return Object.keys(course.prathamBySubject).map((k) => ({ id: k, label: k }));
    }
    return [];
  }, [course]);

  const activeLectures = useMemo<LectureItem[]>(() => {
    if (!course) return [];
    if (course.tabs && course.tabs.length > 0) {
      const tab = course.tabs.find((t) => t.id === selectedTabId) || course.tabs[0];
      return tab ? tab.items : [];
    }
    if (course.isParmar && course.parmarData && selectedTabId) {
      const subj = course.parmarData[selectedTabId];
      if (!subj) return [];
      return subj.lectures.map((lec, idx) => ({
        id: `${selectedTabId}-${idx}`,
        label: lec.title,
        url: lec.links?.url || '',
        type: lec.links?.url?.endsWith('.pdf') ? 'pdf' : 'abyss',
        links: lec.links,
        subject: selectedTabId,
      }));
    }
    if (course.isPratham && course.prathamBySubject && selectedTabId) {
      return course.prathamBySubject[selectedTabId] || [];
    }
    return [];
  }, [course, selectedTabId]);

  const getLectureKey = (item: LectureItem, index: number) =>
    item.url || item.links?.url || item.id || `${courseId}-${selectedTabId}-${index}`;

  const handleOpenLecture = (item: LectureItem, index: number) => {
    const key = getLectureKey(item, index);
    markLectureWatched(courseId, key);
    recordCourseMemory({
      courseId,
      courseName: course?.name || title,
      lectureTitle: item.label,
      tabId: selectedTabId || 'videos',
      url: key,
      timestamp: Date.now(),
    });
    navigation.navigate('Watch', {
      lecture: item,
      courseId,
      courseTitle: course?.name || title,
      tabId: selectedTabId,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
          {course?.name || title}
        </Text>
        <TouchableOpacity
          onPress={() => toggleCourseBookmark(courseId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={20}
            color={isBookmarked ? colors.accent : colors.textMuted}
            fill={isBookmarked ? colors.accent : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading Course Modules...
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header Card */}
          <View
            style={[
              styles.courseHeader,
              { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.courseTitle, { color: colors.text }]}>{course?.name}</Text>
            {course?.subname ? (
              <Text style={[styles.courseSubname, { color: colors.textMuted }]}>
                {course.subname}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={13} color={colors.accent} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {course?.teacher || 'Educator'}
                </Text>
              </View>
              <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
              <View style={styles.metaItem}>
                <Layers size={13} color={colors.textDim} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {activeLectures.length} Lectures in Tab
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Selector */}
          {tabs.length > 1 && (
            <View
              style={[
                styles.tabBar,
                { backgroundColor: colors.bg, borderBottomColor: colors.borderSubtle },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabList}
              >
                {tabs.map((tab) => {
                  const isActive = selectedTabId === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.tabItem,
                        {
                          backgroundColor: isActive ? colors.accent : colors.bgCard,
                          borderColor: isActive ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedTabId(tab.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: isActive ? '#ffffff' : colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Lectures List */}
          <FlatList
            data={activeLectures}
            keyExtractor={(item, index) => item.id || `lec-${index}`}
            contentContainerStyle={styles.lectureList}
            renderItem={({ item, index }) => {
              const lecKey = getLectureKey(item, index);
              const isWatched = !!watchedMap[lecKey];
              return (
                <LectureRow
                  item={item}
                  index={index}
                  isWatched={isWatched}
                  onPress={() => handleOpenLecture(item, index)}
                  onToggleWatched={() => toggleLectureWatched(courseId, lecKey)}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={32} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textDim }]}>
                  No lectures found in this section.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 13,
  },
  courseHeader: {
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4,
  },
  courseSubname: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  metaText: {
    fontSize: 12,
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabList: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lectureList: {
    padding: spacing.base,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 13,
  },
});
