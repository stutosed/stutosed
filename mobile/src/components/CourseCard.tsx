import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { countCourseStats } from '../data/coursesData';
import { BookOpen, Video, User, ChevronRight } from 'lucide-react-native';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const stats = countCourseStats(course);

  const getCategoryColor = () => {
    const cat = (course.category || '').toLowerCase();
    if (cat.includes('beu')) return colors.beuBlue;
    if (cat.includes('gate')) return colors.orange;
    return colors.govtIndigo;
  };

  const categoryColor = getCategoryColor();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { borderColor: categoryColor, backgroundColor: `${categoryColor}15` }]}>
          <Text style={[styles.badgeText, { color: categoryColor }]}>
            {(course.category || 'General').toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Video size={12} color={colors.textMuted} />
            <Text style={styles.statText}>{stats.videos}</Text>
          </View>
          {stats.resources > 0 && (
            <View style={styles.statItem}>
              <BookOpen size={12} color={colors.textMuted} />
              <Text style={styles.statText}>{stats.resources}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {course.name}
      </Text>

      {course.subname ? (
        <Text style={styles.subname} numberOfLines={1}>
          {course.subname}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.teacherRow}>
          <User size={13} color={colors.accent} />
          <Text style={styles.teacher} numberOfLines={1}>
            {course.teacher || 'Verified Educator'}
          </Text>
        </View>

        <View style={styles.exploreBtn}>
          <Text style={styles.exploreText}>View</Text>
          <ChevronRight size={14} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
    marginBottom: 4,
  },
  subname: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  teacher: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});
