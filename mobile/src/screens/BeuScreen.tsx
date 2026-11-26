import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import { INITIAL_COURSES } from '../data/coursesData';
import { spacing, radii } from '../theme/spacing';
import { GraduationCap, ArrowLeft, BookOpen, ArrowRight } from 'lucide-react-native';

const MODULES = [
  {
    id: 'ee-ece',
    title: 'EE / ECE / EEE 1st Year',
    teacher: 'UMEED Batch (Engineers Ki Pathshala)',
    badge: 'Core Branch',
  },
  {
    id: 'chemistry',
    title: 'Engineering Chemistry Group',
    teacher: 'UMEED Batch • Semester 1 & 2',
    badge: 'Science & Lab',
  },
  {
    id: 'mechanical',
    title: 'Mechanical Engineering (UMEED)',
    teacher: 'Specialized Faculty • Applied Mechanics',
    badge: 'Engineering',
  },
];

export const BeuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const beuCourse = useMemo(
    () => INITIAL_COURSES.find((c) => c.id === 'beu-1st-year'),
    []
  );

  const openBeuCourse = () => {
    navigation.navigate('CourseDetail', {
      courseId: 'beu-1st-year',
      title: beuCourse?.name || 'BEU B.Tech 1st Year',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb matching activeView === 'beu-engineering' */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            style={styles.backLinkBtn}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <ArrowLeft size={14} color={colors.accent} />
            <Text style={[styles.backLinkText, { color: colors.accent }]}>Home</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textDim }}>/</Text>
          <Text style={[styles.breadcrumbCurrent, { color: colors.textMuted }]}>
            BEU Engineering
          </Text>
        </View>

        {/* Page Title Block matching src/app/page.tsx lines 1765-1787 */}
        <View style={styles.headerBlock}>
          <View style={[styles.iconBox, { backgroundColor: colors.beuDim }]}>
            <GraduationCap size={20} color={colors.beuBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Bihar Engineering University (BEU)
            </Text>
          </View>
        </View>
        <Text style={[styles.pageDesc, { color: colors.textMuted }]}>
          Syllabus-aligned B.Tech engineering semester courses, subject folders, and technical
          science lectures.
        </Text>

        {/* Exact CourseCard matching CourseGrid.tsx on website */}
        {beuCourse && <CourseCard course={beuCourse} onPress={openBeuCourse} />}

        {/* Curriculum Subject Folders Preview */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Included Subject Modules
        </Text>

        <View style={styles.modulesList}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={[
                styles.moduleCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={openBeuCourse}
              activeOpacity={0.78}
            >
              <View style={[styles.moduleIcon, { backgroundColor: colors.beuDim }]}>
                <BookOpen size={17} color={colors.beuBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.moduleTitle, { color: colors.text }]}>{mod.title}</Text>
                <Text style={[styles.moduleSub, { color: colors.textMuted }]}>
                  {mod.teacher}
                </Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: colors.bgCardSubtle }]}>
                <Text style={[styles.badgeText, { color: colors.beuBlue }]}>{mod.badge}</Text>
              </View>
              <ArrowRight size={15} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>
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
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
  },
  pageDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  modulesList: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  moduleSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
