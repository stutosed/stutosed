import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { radii } from '../theme/spacing';
import { countCourseStats } from '../data/coursesData';
import { BookOpen, ArrowRight, Bookmark } from 'lucide-react-native';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const { colors, isDark } = useTheme();
  const { bookmarks, toggleCourseBookmark } = useAuth();
  const stats = countCourseStats(course);
  const isBookmarked = bookmarks.includes(course.id);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Top Thumbnail Header Strip matching CourseGrid.tsx .course-card */}
      <View
        style={[
          styles.topBanner,
          {
            backgroundColor: isDark
              ? 'rgba(204, 120, 92, 0.12)'
              : 'rgba(204, 120, 92, 0.09)',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <BookOpen size={18} color={colors.accent} />
        </View>

        <View style={styles.bannerRight}>
          <View
            style={[
              styles.lecturesPill,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.lecturesPillText, { color: colors.text }]}>
              {stats.videos} Lectures
            </Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              toggleCourseBookmark(course.id);
            }}
            style={[
              styles.bookmarkBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: isBookmarked ? colors.accent : colors.border,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bookmark
              size={13}
              color={isBookmarked ? colors.accent : colors.textDim}
              fill={isBookmarked ? colors.accent : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Course Body */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {course.name}
        </Text>

        <Text style={[styles.teacher, { color: colors.accent }]} numberOfLines={1}>
          {course.teacher || 'Verified Educator'}
        </Text>

        {course.subname ? (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
            {course.subname}
          </Text>
        ) : null}

        <View style={styles.openHint}>
          <Text style={[styles.openHintText, { color: colors.accent }]}>Open Course</Text>
          <ArrowRight size={14} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topBanner: {
    height: 72,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lecturesPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  lecturesPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 23,
    marginBottom: 5,
  },
  teacher: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  openHint: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
