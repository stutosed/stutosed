import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
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

const THUMB_PALETTES: Array<[string, string, string]> = [
  ['#1e293b', '#cc785c', '#f59e0b'],
  ['#18181b', '#6366f1', '#38bdf8'],
  ['#1f1b24', '#d97706', '#fb7185'],
  ['#0f172a', '#0ea5e9', '#34d399'],
  ['#27171a', '#e11d48', '#fb923c'],
  ['#142420', '#10b981', '#a3e635'],
  ['#1e1b2e', '#8b5cf6', '#ec4899'],
  ['#261c15', '#b45309', '#facc15'],
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getYouTubeThumb(item: LectureItem): string | null {
  const url = item.links?.url || item.servers?.[0]?.url || item.url || '';
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg` : null;
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

  const remoteThumb = useMemo(() => {
    const candidate = item.thumb || item.preview;
    if (candidate && candidate.startsWith('http')) return candidate;
    return getYouTubeThumb(item);
  }, [item]);

  const palette = useMemo(() => {
    const seed = hashString(`${item.label || ''}-${index}`);
    return THUMB_PALETTES[seed % THUMB_PALETTES.length];
  }, [item.label, index]);

  const gradId = useMemo(
    () => `lecGrad_${index}_${hashString(item.label || 'v') % 9999}`,
    [index, item.label]
  );

  const indexLabel = String(index + 1).padStart(2, '0');

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
      activeOpacity={0.75}
    >
      {/* YouTube-style 16:9 Video Thumbnail */}
      <View style={[styles.thumbContainer, { borderColor: colors.borderSubtle }]}>
        {remoteThumb ? (
          <Image source={{ uri: remoteThumb }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <Svg width="100%" height="100%" viewBox="0 0 160 90" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={palette[0]} stopOpacity="1" />
                <Stop offset="65%" stopColor={palette[1]} stopOpacity="0.88" />
                <Stop offset="100%" stopColor={palette[2]} stopOpacity="0.72" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="160" height="90" fill={`url(#${gradId})`} />
            <Circle cx="136" cy="18" r="28" fill="#ffffff" fillOpacity="0.12" />
            <Circle cx="24" cy="76" r="22" fill="#000000" fillOpacity="0.22" />
            <Path
              d="M0 68 Q 42 50, 88 66 T 160 56 L 160 90 L 0 90 Z"
              fill="#000000"
              fillOpacity="0.24"
            />
          </Svg>
        )}

        {/* Center Play / PDF Badge */}
        <View style={styles.thumbCenterBadge}>
          {isPdf ? (
            <FileText size={13} color="#ffffff" />
          ) : (
            <Play size={13} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
          )}
        </View>

        {/* Bottom-left Lecture Number Pill */}
        <View style={styles.thumbIndexPill}>
          <Text style={styles.thumbIndexText}>#{indexLabel}</Text>
        </View>

        {/* Bottom-right Format / Watched Micro Chip */}
        <View
          style={[
            styles.thumbTagPill,
            { backgroundColor: isPdf ? 'rgba(217,119,6,0.88)' : 'rgba(18,17,16,0.72)' },
          ]}
        >
          <Text style={styles.thumbTagText}>{isPdf ? 'PDF' : 'HD'}</Text>
        </View>
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
        ) : (
          <Text style={[styles.subject, { color: colors.textDim }]} numberOfLines={1}>
            {isPdf ? 'PDF Resource' : `Lecture ${index + 1}`}
          </Text>
        )}
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
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  thumbContainer: {
    width: 108,
    height: 61,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: spacing.md,
    backgroundColor: '#161514',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbCenterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(18, 17, 16, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIndexPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(18, 17, 16, 0.72)',
  },
  thumbIndexText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  thumbTagPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  thumbTagText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  subject: {
    fontSize: 11,
    marginTop: 3,
  },
  checkButton: {
    padding: 4,
  },
});
