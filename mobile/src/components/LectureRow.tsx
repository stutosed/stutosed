import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LectureItem } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { Play, FileText, CheckCircle2 } from 'lucide-react-native';

interface LectureRowProps {
  item: LectureItem;
  index: number;
  isWatched?: boolean;
  onPress: () => void;
  onToggleWatched?: () => void;
}

export const LectureRow: React.FC<LectureRowProps> = ({
  item,
  index,
  isWatched = false,
  onPress,
  onToggleWatched,
}) => {
  const isPdf = item.type === 'pdf';

  return (
    <TouchableOpacity
      style={[styles.row, isWatched && styles.watchedRow]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.indexBox}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={[styles.typeBadge, isPdf ? styles.pdfBadge : styles.videoBadge]}>
        {isPdf ? (
          <FileText size={14} color={colors.orange} />
        ) : (
          <Play size={14} color={colors.accent} fill={colors.accent} />
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.label, isWatched && styles.watchedLabel]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        {item.subject ? (
          <Text style={styles.subject} numberOfLines={1}>
            {item.subject}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.checkButton}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleWatched?.();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <CheckCircle2
          size={18}
          color={isWatched ? colors.green : colors.border}
          fill={isWatched ? `${colors.green}20` : 'transparent'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  watchedRow: {
    borderColor: colors.greenDim,
    backgroundColor: `${colors.green}08`,
  },
  indexBox: {
    width: 24,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  videoBadge: {
    backgroundColor: `${colors.accent}15`,
  },
  pdfBadge: {
    backgroundColor: `${colors.orange}15`,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  watchedLabel: {
    color: colors.textMuted,
  },
  subject: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  checkButton: {
    padding: 4,
  },
});
