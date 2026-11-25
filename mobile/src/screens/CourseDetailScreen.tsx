import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, LectureItem } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { loadCourseDetails } from '../data/coursesData';
import { LectureRow } from '../components/LectureRow';
import { ArrowLeft, User, BookOpen, Layers } from 'lucide-react-native';

type CourseDetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;

export const CourseDetailScreen: React.FC = () => {
  const route = useRoute<CourseDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { courseId, title } = route.params;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTabId, setSelectedTabId] = useState<string>('');
  const [watchedLectures, setWatchedLectures] = useState<Record<string, boolean>>({});

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

  const toggleWatched = (lectureId: string) => {
    setWatchedLectures((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const handleOpenLecture = (item: LectureItem) => {
    navigation.navigate('Watch', {
      lecture: item,
      courseId,
      courseTitle: course?.name || title,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {course?.name || title}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading Course Modules...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header Card */}
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course?.name}</Text>
            {course?.subname ? (
              <Text style={styles.courseSubname}>{course.subname}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={13} color={colors.accent} />
                <Text style={styles.metaText}>{course?.teacher || 'Educator'}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Layers size={13} color={colors.textDim} />
                <Text style={styles.metaText}>{activeLectures.length} Lectures in Tab</Text>
              </View>
            </View>
          </View>

          {/* Tab Selector */}
          {tabs.length > 1 && (
            <View style={styles.tabBar}>
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
                      style={[styles.tabItem, isActive && styles.tabItemActive]}
                      onPress={() => setSelectedTabId(tab.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.tabText, isActive && styles.tabTextActive]}
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
              const lecId = item.id || `${selectedTabId}-${index}`;
              const isWatched = !!watchedLectures[lecId];
              return (
                <LectureRow
                  item={item}
                  index={index}
                  isWatched={isWatched}
                  onPress={() => handleOpenLecture(item)}
                  onToggleWatched={() => toggleWatched(lecId)}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={32} color={colors.textDim} />
                <Text style={styles.emptyText}>No lectures found in this section.</Text>
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
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.textMuted,
  },
  courseHeader: {
    padding: spacing.base,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 26,
    marginBottom: 4,
  },
  courseSubname: {
    fontSize: 13,
    color: colors.textMuted,
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
    backgroundColor: colors.border,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  tabBar: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#ffffff',
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
    color: colors.textDim,
  },
});
