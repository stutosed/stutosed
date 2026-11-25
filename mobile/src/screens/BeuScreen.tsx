import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { GraduationCap, BookOpen, Layers, ArrowRight } from 'lucide-react-native';

const MODULES = [
  {
    id: 'ee-ece',
    title: 'EE / ECE / EEE 1st Year',
    teacher: 'UMEED Batch (Engineers Ki Pathshala)',
    lectures: '180+ Lectures',
    badge: 'Core Branch',
  },
  {
    id: 'chemistry',
    title: 'Engineering Chemistry Group',
    teacher: 'UMEED Batch',
    lectures: '85+ Lectures',
    badge: 'Semester 1 & 2',
  },
  {
    id: 'mechanical',
    title: 'Mechanical Engineering (UMEED)',
    teacher: 'Specialized Faculty',
    lectures: '60+ Lectures',
    badge: 'Applied Mechanics',
  },
];

export const BeuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const openBeuCourse = () => {
    navigation.navigate('CourseDetail', {
      courseId: 'beu-btech-1st-year',
      title: 'BEU B.Tech 1st Year Engineering',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <GraduationCap size={22} color={colors.beuBlue} />
          </View>
          <View>
            <Text style={styles.title}>Bihar Engineering University</Text>
            <Text style={styles.subtitle}>BEU B.Tech 1st Year (UMEED Batch)</Text>
          </View>
        </View>

        {/* Hero Card */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={openBeuCourse}
          activeOpacity={0.8}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>OFFICIAL SYLLABUS</Text>
          </View>
          <Text style={styles.heroTitle}>BEU B.Tech 1st Year Engineering</Text>
          <Text style={styles.heroDesc}>
            Curriculum-aligned 1st Year courses featuring EE/ECE/EEE, Engineering Chemistry,
            Mechanical Engineering (UMEED) & resources.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.metaRow}>
              <BookOpen size={14} color={colors.accent} />
              <Text style={styles.metaText}>320+ Classes & Notes</Text>
            </View>
            <View style={styles.openBtn}>
              <Text style={styles.openBtnText}>Open Syllabus</Text>
              <ArrowRight size={14} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Included Modules</Text>

        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.moduleCard}
            onPress={openBeuCourse}
            activeOpacity={0.7}
          >
            <View style={styles.moduleTop}>
              <Text style={styles.moduleBadge}>{mod.badge}</Text>
              <Text style={styles.moduleLectures}>{mod.lectures}</Text>
            </View>
            <Text style={styles.moduleTitle}>{mod.title}</Text>
            <Text style={styles.moduleTeacher}>{mod.teacher}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: `${colors.beuBlue}18`,
    borderWidth: 1,
    borderColor: `${colors.beuBlue}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.beuBlue}20`,
    borderWidth: 1,
    borderColor: colors.beuBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.beuBlue,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
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
    color: colors.text,
    marginBottom: spacing.md,
  },
  moduleCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: colors.accent,
    textTransform: 'uppercase',
  },
  moduleLectures: {
    fontSize: 11,
    color: colors.textDim,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  moduleTeacher: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
