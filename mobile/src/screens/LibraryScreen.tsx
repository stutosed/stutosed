import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { BookmarkCheck, Clock, BookOpen, ArrowRight } from 'lucide-react-native';

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <BookmarkCheck size={22} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.title}>My Library</Text>
            <Text style={styles.subtitle}>Saved notes, lectures & history</Text>
          </View>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statBox}>
            <Clock size={16} color={colors.accent} />
            <Text style={styles.statValue}>Instant</Text>
            <Text style={styles.statLabel}>Cloud Sync</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <BookOpen size={16} color={colors.green} />
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Ad-Free</Text>
          </View>
        </View>

        {/* Continue Learning Prompt */}
        <View style={styles.emptyCard}>
          <BookmarkCheck size={36} color={colors.accent} />
          <Text style={styles.emptyTitle}>Ready to Study?</Text>
          <Text style={styles.emptySubtitle}>
            Your watched lectures, bookmarks, and completed syllabus modules will appear here
            automatically.
          </Text>

          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Browse Courses</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
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
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
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
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    height: 32,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
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
