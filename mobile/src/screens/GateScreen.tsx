import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../theme/spacing';
import { Cpu, Video, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react-native';

export const GateScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const openGateCourse = () => {
    navigation.navigate('CourseDetail', {
      courseId: 'gate-ece-made-easy-signal-system',
      title: 'GATE ECE Made Easy — Signals & Systems',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.topBarTitle, { color: colors.text }]}>GATE Engineering</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.orange}18`, borderColor: `${colors.orange}40` },
            ]}
          >
            <Cpu size={22} color={colors.orange} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>GATE ECE Track</Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>
              Electronics & Communication Engineering
            </Text>
          </View>
        </View>

        {/* Hero Card */}
        <TouchableOpacity
          style={[
            styles.heroCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
          onPress={openGateCourse}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: `${colors.orange}20`, borderColor: colors.orange },
            ]}
          >
            <Text style={[styles.heroBadgeText, { color: colors.orange }]}>TOP RATED</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            GATE ECE Made Easy — Signals & Systems
          </Text>
          <Text style={[styles.heroDesc, { color: colors.textMuted }]}>
            Comprehensive Made Easy premier batch covering Signals & Systems, Fourier Analysis,
            Laplace, Z-Transform & Sampling Theory.
          </Text>

          <View style={[styles.heroFooter, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metaRow}>
              <Video size={14} color={colors.accent} />
              <Text style={[styles.metaText, { color: colors.text }]}>
                36 High-Yield Classes
              </Text>
            </View>
            <View style={[styles.openBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.openBtnText}>Start Learning</Text>
              <ArrowRight size={14} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>Course Highlights</Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Complete Made Easy class syllabus coverage
            </Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              In-depth numerical problem-solving sessions
            </Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Full HD video lectures with instant streaming
            </Text>
          </View>
        </View>
      </ScrollView>
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
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  infoCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: 13,
  },
});
