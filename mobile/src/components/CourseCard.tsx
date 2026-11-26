import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { countCourseStats } from '../data/coursesData';
import { BookOpen, Video, User, ChevronRight, Bookmark } from 'lucide-react-native';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const { colors } = useTheme();
  const { bookmarks, toggleCourseBookmark } = useAuth();
  const stats = countCourseStats(course);
  const isBookmarked = bookmarks.includes(course.id);

  const getCategoryColor = () => {
    const cat = (course.category || '').toLowerCase();
    if (cat.includes('beu')) return colors.beuBlue;
    if (cat.includes('gate')) return colors.orange;
    return colors.govtIndigo;
  };

  const categoryColor = getCategoryColor();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.badge,
            { borderColor: categoryColor, backgroundColor: `${categoryColor}15` },
          ]}
        >
          <Text style={[styles.badgeText, { color: categoryColor }]}>
            {(course.category || 'General').toUpperCase()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Video size={12} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>{stats.videos}</Text>
          </View>
          {stats.resources > 0 && (
            <View style={styles.statItem}>
              <BookOpen size={12} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{stats.resources}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              toggleCourseBookmark(course.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: 4 }}
          >
            <Bookmark
              size={15}
              color={isBookmarked ? colors.accent : colors.textDim}
              fill={isBookmarked ? colors.accent : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {course.name}
      </Text>

      {course.subname ? (
        <Text style={[styles.subname, { color: colors.textMuted }]} numberOfLines={1}>
          {course.subname}
        </Text>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.teacherRow}>
          <User size={13} color={colors.accent} />
          <Text style={[styles.teacher, { color: colors.textMuted }]} numberOfLines={1}>
            {course.teacher || 'Verified Educator'}
          </Text>
        </View>

        <View style={styles.exploreBtn}>
          <Text style={[styles.exploreText, { color: colors.accent }]}>Explore</Text>
          <ChevronRight size={14} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
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
    fontWeight: '500',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 4,
  },
  subname: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
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
  },
});
