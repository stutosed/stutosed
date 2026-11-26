import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../theme/spacing';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react-native';

const MODULES = [
  {
    id: 'ee-ece',
    title: 'EE / ECE / EEE 1st Year',
    teacher: 'UMEED Batch (Engineers Ki Pathshala)',
    lectures: 'Core Modules',
    badge: 'Core Branch',
  },
  {
    id: 'chemistry',
    title: 'Engineering Chemistry Group',
    teacher: 'UMEED Batch',
    lectures: 'Semester 1 & 2',
    badge: 'Science & Lab',
  },
  {
    id: 'mechanical',
    title: 'Mechanical Engineering (UMEED)',
    teacher: 'Specialized Faculty',
    lectures: 'Applied Mechanics',
    badge: 'Engineering',
  },
];

export const BeuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const openBeuCourse = () => {
    navigation.navigate('CourseDetail', {
      courseId: 'beu-1st-year',
      title: 'BEU B.Tech 1st Year',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.beuBlue}18`, borderColor: `${colors.beuBlue}40` },
            ]}
          >
            <GraduationCap size={22} color={colors.beuBlue} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Bihar Engineering University
            </Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>
              BEU B.Tech 1st Year • 7 Core Branches
            </Text>
          </View>
        </View>

        {/* Hero Card */}
        <TouchableOpacity
          style={[
            styles.heroCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
          onPress={openBeuCourse}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: `${colors.beuBlue}20`, borderColor: colors.beuBlue },
            ]}
          >
            <Text style={[styles.heroBadgeText, { color: colors.beuBlue }]}>
              OFFICIAL SYLLABUS
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>BEU B.Tech 1st Year</Text>
          <Text style={[styles.heroDesc, { color: colors.textMuted }]}>
            Curriculum-aligned 1st Year courses featuring EE/ECE/EEE, Engineering Chemistry,
            Mechanical Engineering (UMEED) & PDF resources.
          </Text>

          <View style={[styles.heroFooter, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metaRow}>
              <BookOpen size={14} color={colors.accent} />
              <Text style={[styles.metaText, { color: colors.text }]}>
                865 Classes & 86 Notes
              </Text>
            </View>
            <View style={[styles.openBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.openBtnText}>Open Syllabus</Text>
              <ArrowRight size={14} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>Included Modules</Text>

        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={[
              styles.moduleCard,
              { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
            ]}
            onPress={openBeuCourse}
            activeOpacity={0.7}
          >
            <View style={styles.moduleTop}>
              <Text style={[styles.moduleBadge, { color: colors.accent }]}>{mod.badge}</Text>
              <Text style={[styles.moduleLectures, { color: colors.textDim }]}>{mod.lectures}</Text>
            </View>
            <Text style={[styles.moduleTitle, { color: colors.text }]}>{mod.title}</Text>
            <Text style={[styles.moduleTeacher, { color: colors.textMuted }]}>{mod.teacher}</Text>
          </TouchableOpacity>
        ))}
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
  heroCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  moduleCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  moduleBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  moduleLectures: {
    fontSize: 11,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  moduleTeacher: {
    fontSize: 12,
  },
});
