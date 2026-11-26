import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LectureItem } from '../types';
import { useTheme } from '../context/ThemeContext';
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
  const { colors } = useTheme();
  const isPdf = item.type === 'pdf';

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: isWatched ? `${colors.green}08` : colors.bgCard,
          borderColor: isWatched ? colors.greenDim : colors.borderSubtle,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.indexBox}>
        <Text style={[styles.indexText, { color: colors.textDim }]}>{index + 1}</Text>
      </View>

      <View
        style={[
          styles.typeBadge,
          { backgroundColor: isPdf ? `${colors.orange}15` : `${colors.accent}15` },
        ]}
      >
        {isPdf ? (
          <FileText size={14} color={colors.orange} />
        ) : (
          <Play size={14} color={colors.accent} fill={colors.accent} />
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.label,
            { color: isWatched ? colors.textMuted : colors.text },
          ]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        {item.subject ? (
          <Text style={[styles.subject, { color: colors.textDim }]} numberOfLines={1}>
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
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  indexBox: {
    width: 24,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  subject: {
    fontSize: 11,
    marginTop: 2,
  },
  checkButton: {
    padding: 4,
  },
});
