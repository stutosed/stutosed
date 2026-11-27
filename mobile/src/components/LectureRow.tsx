import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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

const SLIDE_THEMES: Array<{ bg: string; glow: string; accent: string }> = [
  { bg: '#1c1917', glow: 'rgba(204, 120, 92, 0.24)', accent: '#e08b6f' },
  { bg: '#171c28', glow: 'rgba(99, 102, 241, 0.26)', accent: '#818cf8' },
  { bg: '#152026', glow: 'rgba(14, 165, 233, 0.24)', accent: '#38bdf8' },
  { bg: '#18211d', glow: 'rgba(16, 185, 129, 0.22)', accent: '#34d399' },
  { bg: '#21191d', glow: 'rgba(244, 63, 94, 0.22)', accent: '#fb7185' },
  { bg: '#211c14', glow: 'rgba(245, 158, 11, 0.24)', accent: '#fbbf24' },
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

function getSlideHeadline(label: string): string {
  const cleaned = label
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b(Class|Lec|Lecture|Part)\s*[-:#]?\s*\d+/gi, ' ')
    .replace(/[|•\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || label.trim() || 'Video Lecture';
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
  const [imgFailed, setImgFailed] = useState(false);

  const remoteThumb = useMemo(() => {
    const candidate = item.thumb || item.preview;
    if (candidate && candidate.startsWith('http')) return candidate;
    return getYouTubeThumb(item);
  }, [item]);

  const slideTheme = useMemo(() => {
    const seed = hashString(`${item.label || ''}-${index}`);
    return SLIDE_THEMES[seed % SLIDE_THEMES.length];
  }, [item.label, index]);

  const slideHeadline = useMemo(() => getSlideHeadline(item.label || ''), [item.label]);
  const indexLabel = String(index + 1).padStart(2, '0');
  const showRemoteImage = Boolean(remoteThumb) && !imgFailed;

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
      {/* YouTube-style 16:9 Lecture Slide / Video Thumbnail */}
      <View
        style={[
          styles.thumbContainer,
          { backgroundColor: slideTheme.bg, borderColor: 'rgba(255,255,255,0.12)' },
        ]}
      >
        {showRemoteImage && remoteThumb ? (
          <>
            <Image
              source={{ uri: remoteThumb }}
              style={styles.thumbImage}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
            <View style={styles.remotePlayOrb}>
              <Play size={11} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
            </View>
          </>
        ) : (
          <View style={styles.slideCanvas}>
            {/* Subtle top accent bar & corner glow */}
            <View style={[styles.slideTopAccent, { backgroundColor: slideTheme.accent }]} />
            <View style={[styles.slideGlowOrb, { backgroundColor: slideTheme.glow }]} />

            {/* Top Row: Eyebrow + Play Orb */}
            <View style={styles.slideHeaderRow}>
              <Text style={[styles.slideEyebrow, { color: slideTheme.accent }]} numberOfLines={1}>
                {isPdf ? `DOC ${indexLabel}` : `LEC ${indexLabel}`}
              </Text>
              <View style={styles.slidePlayMini}>
                {isPdf ? (
                  <FileText size={9} color="#ffffff" />
                ) : (
                  <Play size={9} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
                )}
              </View>
            </View>

            {/* Center Headline Preview (just like YT lecture slide cards) */}
            <Text style={styles.slideTitleText} numberOfLines={2}>
              {slideHeadline}
            </Text>
          </View>
        )}

        {/* Bottom-right Format Micro Chip */}
        <View
          style={[
            styles.thumbTagPill,
            { backgroundColor: isPdf ? 'rgba(217,119,6,0.9)' : 'rgba(0,0,0,0.68)' },
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
        <Text style={[styles.subject, { color: colors.textDim }]} numberOfLines={1}>
          {item.subject || (isPdf ? 'PDF Resource' : `Lecture ${index + 1}`)}
        </Text>
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
    width: 112,
    height: 63,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: spacing.md,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  remotePlayOrb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 17, 16, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCanvas: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    justifyContent: 'space-between',
    position: 'relative',
  },
  slideTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  slideGlowOrb: {
    position: 'absolute',
    right: -14,
    bottom: -14,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  slideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slideEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  slidePlayMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitleText: {
    color: '#f5f4f0',
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 12,
    paddingRight: 22,
  },
  thumbTagPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3.5,
  },
  thumbTagText: {
    color: '#ffffff',
    fontSize: 8,
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
