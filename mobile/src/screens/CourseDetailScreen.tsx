import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, LectureItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { triggerSmoothLayout } from '../lib/layoutAnim';
import { loadCourseDetails } from '../data/coursesData';
import { LectureRow } from '../components/LectureRow';
import {
  ArrowLeft,
  User,
  BookOpen,
  Layers,
  Bookmark,
  Folder,
  Video,
  FileText,
  ChevronRight,
  Search,
  X,
  LayoutList,
  LayoutGrid,
} from 'lucide-react-native';

type CourseDetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;
type MediaFilter = 'all' | 'videos' | 'pdfs';
type ViewMode = 'list' | 'grid';

interface CourseSection {
  id: string;
  label: string;
  subname?: string;
  items: LectureItem[];
}

function isPdfItem(item: LectureItem): boolean {
  return (
    item.type === 'pdf' ||
    item.category === 'pdfs' ||
    (item.url || '').toLowerCase().endsWith('.pdf')
  );
}

function buildSectionItems(course: Course, sectionId: string): LectureItem[] {
  if (course.tabs && course.tabs.length > 0) {
    const tab = course.tabs.find((t) => t.id === sectionId) || course.tabs[0];
    return tab ? tab.items : [];
  }

  if (course.isParmar && course.parmarData) {
    const subj = course.parmarData[sectionId];
    if (!subj) return [];
    const items: LectureItem[] = [];
    subj.lectures.forEach((lec, idx) => {
      if (lec.links?.url) {
        items.push({
          id: `${sectionId}-${idx}`,
          label: lec.title,
          url: lec.links.url,
          type: lec.links.url.endsWith('.pdf') ? 'pdf' : 'external',
          links: lec.links,
          subject: sectionId,
        });
      }
      // Include section PDFs (Notes EN/HI, Handwritten, Quiz) right inside this section
      const pdfFields: Array<{ key: string; suffix: string }> = [
        { key: 'notes_en', suffix: 'Notes (English)' },
        { key: 'notes_hi', suffix: 'Notes (Hindi)' },
        { key: 'handwritten', suffix: 'Handwritten Notes' },
        { key: 'quiz', suffix: 'Practice Quiz PDF' },
      ];
      pdfFields.forEach(({ key, suffix }) => {
        const pdfUrl = lec.links?.[key];
        if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) {
          items.push({
            id: `${sectionId}-${idx}-${key}`,
            label: `${lec.title} • ${suffix}`,
            url: pdfUrl,
            type: 'pdf',
            category: 'pdfs',
            subject: sectionId,
          });
        }
      });
    });
    return items;
  }

  if (course.isPratham && course.prathamBySubject) {
    return course.prathamBySubject[sectionId] || [];
  }

  return [];
}

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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    let isMounted = true;
    setSelectedSectionId(null);
    setSearchQuery('');
    setMediaFilter('all');

    loadCourseDetails(courseId).then((data) => {
      if (isMounted) {
        setCourse(data);
        // Only auto-open the items directly if there is 1 section (no folder selection needed)
        if (data?.tabs && data.tabs.length === 1) {
          setSelectedSectionId(data.tabs[0].id);
        } else if (data?.isParmar && data.parmarData) {
          const keys = Object.keys(data.parmarData);
          if (keys.length === 1) setSelectedSectionId(keys[0]);
        } else if (data?.isPratham && data.prathamBySubject) {
          const keys = Object.keys(data.prathamBySubject).filter((k) => k !== 'No Topic');
          if (keys.length === 1) setSelectedSectionId(keys[0]);
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const sections = useMemo<CourseSection[]>(() => {
    if (!course) return [];
    if (course.tabs && course.tabs.length > 0) {
      return course.tabs.map((t) => ({
        id: t.id,
        label: t.label,
        subname: t.subname,
        items: t.items || [],
      }));
    }
    if (course.isParmar && course.parmarData) {
      return Object.keys(course.parmarData).map((k) => ({
        id: k,
        label: k,
        items: buildSectionItems(course, k),
      }));
    }
    if (course.isPratham && course.prathamBySubject) {
      return Object.keys(course.prathamBySubject)
        .filter((k) => k !== 'No Topic')
        .map((k) => ({
          id: k,
          label: k,
          items: course.prathamBySubject?.[k] || [],
        }));
    }
    return [];
  }, [course]);

  const isMultiSection = sections.length > 1;
  const activeSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || (sections.length === 1 ? sections[0] : null),
    [sections, selectedSectionId]
  );

  // Android Hardware Back: inside a chapter -> go back to Chapters Directory first
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isMultiSection && selectedSectionId) {
          triggerSmoothLayout();
          setSelectedSectionId(null);
          setSearchQuery('');
          setMediaFilter('all');
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [isMultiSection, selectedSectionId])
  );

  const handleHeaderBack = () => {
    if (isMultiSection && selectedSectionId) {
      triggerSmoothLayout();
      setSelectedSectionId(null);
      setSearchQuery('');
      setMediaFilter('all');
    } else {
      navigation.goBack();
    }
  };

  const getLectureKey = useCallback(
    (item: LectureItem, index: number, secId: string) =>
      item.url ||
      item.links?.url ||
      item.servers?.[0]?.url ||
      item.id ||
      `${courseId}-${secId}-${index}`,
    [courseId]
  );

  const isItemWatchedInMap = useCallback(
    (item: LectureItem, index: number, secId: string) => {
      const candidates = [
        item.url,
        item.links?.url,
        ...(item.servers?.map((s) => s.url) || []),
        item.id,
        `${courseId}-${secId}-${index}`,
      ];
      return candidates.some((c) => Boolean(c && watchedMap[c]));
    },
    [courseId, watchedMap]
  );

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.items.some((it) => (it.label || '').toLowerCase().includes(q))
    );
  }, [sections, searchQuery]);

  const sectionCounts = useMemo(() => {
    const items = activeSection?.items || [];
    const pdfs = items.filter(isPdfItem).length;
    const videos = items.length - pdfs;
    return { all: items.length, videos, pdfs };
  }, [activeSection]);

  const activeItems = useMemo<LectureItem[]>(() => {
    if (!activeSection) return [];
    let list = activeSection.items;
    if (mediaFilter === 'videos') {
      list = list.filter((i) => !isPdfItem(i));
    } else if (mediaFilter === 'pdfs') {
      list = list.filter(isPdfItem);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (i) =>
        (i.label || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q)
    );
  }, [activeSection, mediaFilter, searchQuery]);

  const handleOpenLecture = (item: LectureItem, index: number) => {
    const secId = activeSection?.id || 'videos';
    const key = getLectureKey(item, index, secId);
    markLectureWatched(courseId, key);
    recordCourseMemory({
      courseId,
      courseName: course?.name || title,
      lectureTitle: item.label,
      tabId: secId,
      url: key,
      timestamp: Date.now(),
    });
    const sectionVideos = (activeSection?.items || []).filter((i) => !isPdfItem(i));
    const vidIdx = !isPdfItem(item)
      ? Math.max(0, sectionVideos.findIndex((i) => i === item || (i.id && i.id === item.id)))
      : 0;
    navigation.navigate('Watch', {
      lecture: item,
      courseId,
      courseTitle: course?.name || title,
      tabId: secId,
      ...(!isPdfItem(item) && sectionVideos.length > 0
        ? { playlist: sectionVideos, initialIndex: vidIdx }
        : {}),
    });
  };

  const openSection = (secId: string) => {
    triggerSmoothLayout();
    setSelectedSectionId(secId);
    setSearchQuery('');
    setMediaFilter('all');
  };

  const showDirectory = isMultiSection && !selectedSectionId;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleHeaderBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
          {activeSection && isMultiSection ? activeSection.label : course?.name || title}
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
      ) : showDirectory ? (
        /* STEP 1: CHAPTERS / FOLDERS LIST (No horizontal sliding required!) */
        <FlatList
          data={filteredSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.directoryList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.directoryHeaderWrap}>
              <View
                style={[
                  styles.courseBanner,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
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
                    <Folder size={13} color={colors.govtIndigo} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {sections.length} Chapters / Sections
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <Search size={15} color={colors.textDim} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search chapters or topics..."
                  placeholderTextColor={colors.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color={colors.textDim} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.directoryHeading, { color: colors.textMuted }]}>
                SELECT A CHAPTER OR SECTION
              </Text>
            </View>
          }
          renderItem={({ item: sec, index }) => {
            const pdfCount = sec.items.filter(isPdfItem).length;
            const vidCount = sec.items.length - pdfCount;
            const watchedInSec = sec.items.filter((it, idx) =>
              isItemWatchedInMap(it, idx, sec.id)
            ).length;
            const pct = sec.items.length > 0 ? Math.round((watchedInSec / sec.items.length) * 100) : 0;

            return (
              <TouchableOpacity
                style={[
                  styles.folderRow,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
                onPress={() => openSection(sec.id)}
                activeOpacity={0.78}
              >
                <View style={[styles.folderIconBox, { backgroundColor: 'rgba(204,120,92,0.14)' }]}>
                  <Folder size={20} color={colors.accent} />
                </View>

                <View style={styles.folderBody}>
                  <Text style={[styles.folderTitle, { color: colors.text }]} numberOfLines={2}>
                    {sec.label}
                  </Text>
                  <View style={styles.folderMetaRow}>
                    <View style={styles.folderStatChip}>
                      <Video size={11} color={colors.accent} />
                      <Text style={[styles.folderStatText, { color: colors.textMuted }]}>
                        {vidCount} Lectures
                      </Text>
                    </View>
                    <View style={styles.folderStatChip}>
                      <FileText size={11} color={colors.govtIndigo} />
                      <Text style={[styles.folderStatText, { color: colors.textMuted }]}>
                        {pdfCount} PDFs
                      </Text>
                    </View>
                    {watchedInSec > 0 && (
                      <Text style={[styles.folderDoneText, { color: colors.green }]}>
                        • {pct}% done
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.folderIndexRight}>
                  <Text style={[styles.folderNum, { color: colors.textDim }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <ChevronRight size={17} color={colors.textDim} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* STEP 2: INSIDE SECTION (Lectures + Section PDFs + List/Grid Switcher) */
        <View style={{ flex: 1 }}>
          {/* Section Sub-Header + Filter & List/Grid Toolbar */}
          <View
            style={[
              styles.sectionToolbar,
              { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.toolbarTopRow}>
              {isMultiSection ? (
                <TouchableOpacity
                  style={[
                    styles.allChaptersBtn,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                  onPress={handleHeaderBack}
                  activeOpacity={0.75}
                >
                  <ArrowLeft size={13} color={colors.accent} />
                  <Text style={[styles.allChaptersText, { color: colors.accent }]}>
                    All Chapters
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.metaItem}>
                  <Layers size={13} color={colors.accent} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {course?.name}
                  </Text>
                </View>
              )}

              {/* List / Grid View Switcher */}
              <View
                style={[
                  styles.viewSwitchGroup,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.viewSwitchBtn,
                    viewMode === 'list' && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => {
                    if (viewMode !== 'list') {
                      triggerSmoothLayout();
                      setViewMode('list');
                    }
                  }}
                >
                  <LayoutList
                    size={15}
                    color={viewMode === 'list' ? '#ffffff' : colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.viewSwitchBtn,
                    viewMode === 'grid' && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => {
                    if (viewMode !== 'grid') {
                      triggerSmoothLayout();
                      setViewMode('grid');
                    }
                  }}
                >
                  <LayoutGrid
                    size={15}
                    color={viewMode === 'grid' ? '#ffffff' : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search inside Chapter */}
            <View
              style={[
                styles.sectionSearchBox,
                { backgroundColor: colors.bg, borderColor: colors.borderSubtle },
              ]}
            >
              <Search size={14} color={colors.textDim} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search lectures or PDFs in this section..."
                placeholderTextColor={colors.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={colors.textDim} />
                </TouchableOpacity>
              )}
            </View>

            {/* Media Filter Pills: All | Lectures | PDFs & Notes */}
            <View style={styles.filterPillsRow}>
              {(
                [
                  { key: 'all' as const, label: `All (${sectionCounts.all})` },
                  { key: 'videos' as const, label: `Lectures (${sectionCounts.videos})` },
                  { key: 'pdfs' as const, label: `PDFs (${sectionCounts.pdfs})` },
                ] as const
              ).map(({ key, label }) => {
                const active = mediaFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.accent : colors.bg,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (mediaFilter !== key) {
                        triggerSmoothLayout();
                        setMediaFilter(key);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? '#ffffff' : colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Lectures & PDFs in exact natural sequence (Videos in grid/list, PDFs in slim rectangle list) */}
          <FlatList
            key={viewMode}
            data={activeItems}
            numColumns={1}
            keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : `lec-${index}`)}
            contentContainerStyle={styles.lectureList}
            renderItem={({ item, index }) => {
              const secId = activeSection?.id || 'videos';
              const lecKey = getLectureKey(item, index, secId);
              const isWatched = isItemWatchedInMap(item, index, secId);
              const itemIsPdf = isPdfItem(item);
              return (
                <LectureRow
                  item={item}
                  index={index}
                  isWatched={isWatched}
                  variant={itemIsPdf ? 'list' : viewMode}
                  onPress={() => handleOpenLecture(item, index)}
                  onToggleWatched={() => toggleLectureWatched(courseId, lecKey)}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={32} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textDim }]}>
                  {mediaFilter === 'pdfs'
                    ? 'No PDFs or notes uploaded in this section yet.'
                    : 'No items found in this section.'}
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
  directoryList: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  directoryHeaderWrap: {
    gap: 12,
    marginBottom: 12,
  },
  courseBanner: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.base,
  },
  courseTitle: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
    marginBottom: 4,
  },
  courseSubname: {
    fontSize: 12.5,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  directoryHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    paddingHorizontal: 2,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 9,
  },
  folderIconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderBody: {
    flex: 1,
    gap: 4,
  },
  folderTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  folderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  folderStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderStatText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  folderDoneText: {
    fontSize: 11,
    fontWeight: '700',
  },
  folderIndexRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderNum: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionToolbar: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 9,
  },
  toolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  allChaptersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  allChaptersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewSwitchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2.5,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 2,
  },
  viewSwitchBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  sectionSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  lectureList: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: spacing.xxl,
  },
  sectionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  sectionGroupIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionGroupTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  sectionGroupCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  sectionGroupCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridRowGap: {
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
