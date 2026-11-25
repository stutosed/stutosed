import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { Cpu, Video, CheckCircle2, ArrowRight } from 'lucide-react-native';

export const GateScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const openGateCourse = () => {
    navigation.navigate('CourseDetail', {
      courseId: 'gate-ece-made-easy',
      title: 'GATE ECE Made Easy (36 Lectures)',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Cpu size={22} color={colors.orange} />
          </View>
          <View>
            <Text style={styles.title}>GATE Engineering</Text>
            <Text style={styles.subtitle}>Electronics & Communication (ECE)</Text>
          </View>
        </View>

        {/* Hero Card */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={openGateCourse}
          activeOpacity={0.8}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>TOP RATED</Text>
          </View>
          <Text style={styles.heroTitle}>GATE ECE Made Easy — 36 Lectures</Text>
          <Text style={styles.heroDesc}>
            Comprehensive Made Easy premier batch covering Signals & Systems, Electronic Devices,
            Digital Circuits, Communication & Network Theory.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.metaRow}>
              <Video size={14} color={colors.accent} />
              <Text style={styles.metaText}>36 High-Yield Classes</Text>
            </View>
            <View style={styles.openBtn}>
              <Text style={styles.openBtnText}>Start Learning</Text>
              <ArrowRight size={14} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Course Highlights</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={styles.infoText}>Complete Made Easy class syllabus coverage</Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={styles.infoText}>In-depth numerical problem-solving sessions</Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={styles.infoText}>Full HD video lectures with instant streaming</Text>
          </View>
        </View>
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
    backgroundColor: `${colors.orange}18`,
    borderWidth: 1,
    borderColor: `${colors.orange}40`,
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
    backgroundColor: `${colors.orange}20`,
    borderWidth: 1,
    borderColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.orange,
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
  infoCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: colors.textMuted,
  },
});
