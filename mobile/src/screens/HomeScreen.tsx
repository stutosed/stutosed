import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import { INITIAL_COURSES, getTotalStats } from '../data/coursesData';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'all', label: 'All Courses' },
  { id: 'government', label: 'Govt Exams' },
  { id: 'beu', label: 'BEU B.Tech' },
  { id: 'gate', label: 'GATE' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const stats = useMemo(() => getTotalStats(), []);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'all') return INITIAL_COURSES;
    return INITIAL_COURSES.filter(
      (c) => (c.category || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Header />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Hero Section matching Web Design */}
            <View style={styles.hero}>
              <View style={styles.trustBadge}>
                <ShieldCheck size={13} color={colors.green} />
                <Text style={styles.trustText}>Trusted by Students Across India</Text>
              </View>

              <Text style={styles.heroTitle}>Study Smart.{'\n'}Score Higher.</Text>
              <Text style={styles.heroSubtitle}>
                All your SSC, Competitive Exams & BEU B.Tech lectures, notes and resources —
                organized in one clean, ad-free mobile portal.
              </Text>

              {/* Stats Counters */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalCourses}</Text>
                  <Text style={styles.statLabel}>Batches</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalVideos.toLocaleString()}+</Text>
                  <Text style={styles.statLabel}>Lectures</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalPDFs.toLocaleString()}+</Text>
                  <Text style={styles.statLabel}>PDF Notes</Text>
                </View>
              </View>
            </View>

            {/* Category Filter Pills */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Compass size={16} color={colors.accent} />
                <Text style={styles.sectionTitle}>Curated Learning Tracks</Text>
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
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          isActive && styles.categoryTextActive,
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: spacing.base,
  },
  hero: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    textTransform: 'uppercase',
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
    color: colors.text,
    letterSpacing: -0.2,
  },
  categoriesRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
});
