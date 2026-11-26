import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import { INITIAL_COURSES, getTotalStats, getCourseById, isGovernmentCategory } from '../data/coursesData';
import {
  Compass,
  ShieldCheck,
  Search,
  X,
  Play,
  Cpu,
  ChevronRight,
} from 'lucide-react-native';

const CATEGORIES = [
  { id: 'all', label: 'All Courses' },
  { id: 'government', label: 'Govt Exams' },
  { id: 'beu', label: 'BEU B.Tech' },
  { id: 'gate', label: 'GATE' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { lastPlayed, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => getTotalStats(), []);

  const lastPlayedCourse = useMemo(() => {
    if (!lastPlayed?.courseId) return null;
    return getCourseById(lastPlayed.courseId) || null;
  }, [lastPlayed]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INITIAL_COURSES.filter((c) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'government'
          ? isGovernmentCategory(c.category)
          : (c.category || '').toLowerCase() === selectedCategory.toLowerCase());
      if (!matchesCat) return false;
      if (!q) return true;
      const haystack = `${c.name} ${c.subname || ''} ${c.teacher || ''} ${c.subject || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Hero Section */}
            <View style={[styles.hero, { borderBottomColor: colors.borderSubtle }]}>
              <View
                style={[
                  styles.trustBadge,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
              >
                <ShieldCheck size={13} color={colors.green} />
                <Text style={[styles.trustText, { color: colors.textMuted }]}>
                  Trusted by Students Across India • 100% Free
                </Text>
              </View>

              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Study Smart.{'\n'}Score Higher.
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                All your SSC, Competitive Exams & BEU B.Tech lectures, notes and resources —
                organized in one clean, ad-free portal.
              </Text>

              {/* Stats Counters */}
              <View
                style={[
                  styles.statsContainer,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.accent }]}>
                    {stats.totalCourses}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textDim }]}>Batches</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.accent }]}>
                    {stats.totalVideos.toLocaleString()}+
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textDim }]}>Lectures</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.accent }]}>
                    {stats.totalPDFs.toLocaleString()}+
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textDim }]}>PDF Notes</Text>
                </View>
              </View>
            </View>

            {/* Continue Learning Banner */}
            {lastPlayed && lastPlayedCourse && (
              <TouchableOpacity
                style={[
                  styles.continueCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.accent },
                ]}
                onPress={() =>
                  navigation.navigate('CourseDetail', {
                    courseId: lastPlayedCourse.id,
                    title: lastPlayedCourse.name,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={[styles.playCircle, { backgroundColor: colors.accent }]}>
                  <Play size={16} color="#ffffff" fill="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.continueEyebrow, { color: colors.accent }]}>
                    CONTINUE LEARNING
                  </Text>
                  <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                    {lastPlayed.lectureTitle || lastPlayedCourse.name}
                  </Text>
                  <Text style={[styles.continueSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {lastPlayedCourse.name}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.accent} />
              </TouchableOpacity>
            )}

            {/* Quick GATE Spotlight Banner */}
            <TouchableOpacity
              style={[
                styles.gateBanner,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('Gate')}
              activeOpacity={0.75}
            >
              <View style={[styles.gateIconBox, { backgroundColor: `${colors.orange}18` }]}>
                <Cpu size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gateTitle, { color: colors.text }]}>
                  GATE ECE Engineering Track
                </Text>
                <Text style={[styles.gateSub, { color: colors.textMuted }]}>
                  Made Easy 36 Lectures Portal
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textDim} />
            </TouchableOpacity>

            {/* Search & Filter Section */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Compass size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Curated Learning Tracks
                </Text>
                {!user && (
                  <TouchableOpacity
                    style={{ marginLeft: 'auto' }}
                    onPress={() => navigation.navigate('Auth')}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.accent }}>
                      Sync Progress →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Inline Search Bar */}
              <View
                style={[
                  styles.searchWrap,
                  { backgroundColor: colors.bgInput, borderColor: colors.border },
                ]}
              >
                <Search size={16} color={colors.textDim} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search batches, educators, subjects..."
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

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isActive ? colors.accent : colors.bgCard,
                          borderColor: isActive ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: isActive ? '#ffffff' : colors.textMuted },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() =>
              navigation.navigate('CourseDetail', {
                courseId: item.id,
                title: item.name,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              No courses match &ldquo;{searchQuery}&rdquo;.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    padding: spacing.base,
  },
  hero: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.base,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  continueSub: {
    fontSize: 11,
    marginTop: 1,
  },
  gateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  gateIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gateSub: {
    fontSize: 11,
    marginTop: 1,
  },
  filterSection: {
    marginBottom: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  categoriesRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
