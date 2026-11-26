import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getCourseById } from '../data/coursesData';
import { CourseCard } from '../components/CourseCard';
import { spacing, radii } from '../theme/spacing';
import { BookmarkCheck, CheckCircle2, RefreshCw, ArrowRight, BookOpen } from 'lucide-react-native';

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const {
    user,
    isSyncing,
    watchedMap,
    bookmarks,
    refreshSessionAndSync,
  } = useAuth();

  const watchedCount = Object.keys(watchedMap).length;

  const bookmarkedCourses = useMemo(() => {
    return bookmarks
      .map((id) => getCourseById(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [bookmarks]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}40` },
            ]}
          >
            <BookmarkCheck size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>My Library</Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>
              {user ? 'Synced with Turso Cloud' : 'Saved locally on device'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.syncBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={refreshSessionAndSync}
            disabled={isSyncing}
          >
            <RefreshCw size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        <View
          style={[
            styles.statsBanner,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <View style={styles.statBox}>
            <CheckCircle2 size={18} color={colors.green} />
            <Text style={[styles.statValue, { color: colors.text }]}>{watchedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Watched Lectures</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <BookmarkCheck size={18} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {bookmarkedCourses.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Saved Courses</Text>
          </View>
        </View>

        {/* Bookmarked Courses */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Bookmarked Courses</Text>

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
              styles.emptyCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <BookOpen size={34} color={colors.accent} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Bookmarked Courses Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap the bookmark icon on any course card to save it here for instant access.
            </Text>

            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('MainTabs')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreBtnText}>Explore Courses</Text>
              <ArrowRight size={14} color="#ffffff" />
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
