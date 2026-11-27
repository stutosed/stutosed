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
  variant?: 'list' | 'grid';
  onPress: () => void;
  onToggleWatched?: () => void;
}

const SLIDE_THEMES: Array<{ bg: string; glow: string; accent: string; pillBg: string }> = [
  { bg: '#6b2d1c', glow: 'rgba(244, 162, 132, 0.28)', accent: '#f6a88e', pillBg: 'rgba(20, 10, 8, 0.45)' },
  { bg: '#263163', glow: 'rgba(129, 140, 248, 0.30)', accent: '#a5b4fc', pillBg: 'rgba(12, 16, 36, 0.45)' },
  { bg: '#13465e', glow: 'rgba(56, 189, 248, 0.28)', accent: '#7dd3fc', pillBg: 'rgba(8, 24, 34, 0.45)' },
  { bg: '#164d3b', glow: 'rgba(52, 211, 153, 0.26)', accent: '#6ee7b7', pillBg: 'rgba(8, 28, 22, 0.45)' },
  { bg: '#572043', glow: 'rgba(244, 114, 182, 0.28)', accent: '#f9a8d4', pillBg: 'rgba(28, 8, 22, 0.45)' },
  { bg: '#5c3814', glow: 'rgba(251, 191, 36, 0.28)', accent: '#fcd34d', pillBg: 'rgba(28, 18, 6, 0.45)' },
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

function isUnreliablePosterUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // syncp2p returns HTTP 522 timeouts and strp2p poster.png often renders blank dark 0:00 frames
  return lower.includes('syncp2p.com') || lower.includes('strp2p.site');
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
  variant = 'list',
  onPress,
  onToggleWatched,
}) => {
  const { colors } = useTheme();
  const isPdf = item.type === 'pdf' || item.category === 'pdfs' || (item.url || '').toLowerCase().endsWith('.pdf');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const remoteThumb = useMemo(() => {
    const candidate = item.thumb || item.preview;
    if (candidate && candidate.startsWith('http') && !isUnreliablePosterUrl(candidate)) {
      return candidate;
    }
    return getYouTubeThumb(item);
  }, [item]);

  const slideTheme = useMemo(() => {
    const seed = hashString(`${item.label || ''}-${index}`);
    return SLIDE_THEMES[seed % SLIDE_THEMES.length];
  }, [item.label, index]);

  const slideHeadline = useMemo(() => getSlideHeadline(item.label || ''), [item.label]);
  const indexLabel = String(index + 1).padStart(2, '0');
  const shouldLoadImage = Boolean(remoteThumb) && !imgFailed;

  const renderThumbnail = (isGridMode: boolean) => (
    <View
      style={[
        isGridMode ? styles.gridThumbBox : styles.listThumbBox,
        { backgroundColor: slideTheme.bg, borderColor: 'rgba(255,255,255,0.16)' },
      ]}
    >
      {/* Always render crisp non-black lecture slide underneath so loading/error never shows black */}
      <View style={[styles.slideCanvas, isGridMode && { padding: 13 }]}>
        <View style={[styles.slideTopAccent, { backgroundColor: slideTheme.accent, height: isGridMode ? 3.5 : 3 }]} />
        <View
          style={[
            styles.slideGlowOrb,
            isGridMode && { width: 96, height: 96, borderRadius: 48, right: -16, bottom: -18 },
            { backgroundColor: slideTheme.glow },
          ]}
        />
        <View
          style={[
            styles.slideGlowOrbSecondary,
            isGridMode && { width: 64, height: 64, borderRadius: 32, left: -18, top: 18 },
            { backgroundColor: slideTheme.glow },
          ]}
        />

        <View style={styles.slideHeaderRow}>
          <View
            style={[
              styles.slideIndexChip,
              isGridMode && { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
              { backgroundColor: slideTheme.pillBg },
            ]}
          >
            <Text style={[styles.slideEyebrow, isGridMode && { fontSize: 10 }, { color: slideTheme.accent }]}>
              {isPdf ? `PDF ${indexLabel}` : `LEC ${indexLabel}`}
            </Text>
          </View>
          <View style={[styles.slidePlayMini, isGridMode && { width: 32, height: 32, borderRadius: 16 }]}>
            {isPdf ? (
              <FileText size={isGridMode ? 14 : 9} color="#ffffff" />
            ) : (
              <Play size={isGridMode ? 13 : 9} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
            )}
          </View>
        </View>

        <Text
          style={[
            styles.slideTitleText,
            isGridMode && { fontSize: 14.5, lineHeight: 20, paddingRight: 38 },
          ]}
          numberOfLines={2}
        >
          {slideHeadline}
        </Text>
      </View>

      {/* Remote thumbnail overlays only once successfully decoded */}
      {shouldLoadImage && remoteThumb && (
        <Image
          source={{ uri: remoteThumb }}
          style={[
            styles.thumbImageOverlay,
            { opacity: imgLoaded ? 1 : 0 },
          ]}
          resizeMode="cover"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
        />
      )}

      {shouldLoadImage && imgLoaded && (
        <View style={styles.remotePlayOrb}>
          <Play size={11} color="#ffffff" fill="#ffffff" style={{ marginLeft: 1 }} />
        </View>
      )}

      {/* Bottom-right Format / Watched Micro Chip */}
      <View
        style={[
          styles.thumbTagPill,
          {
            backgroundColor: isPdf
              ? 'rgba(217, 119, 6, 0.92)'
              : isWatched
              ? 'rgba(22, 163, 74, 0.9)'
              : 'rgba(0, 0, 0, 0.62)',
          },
        ]}
      >
        <Text style={styles.thumbTagText}>{isPdf ? 'PDF' : isWatched ? 'DONE' : 'HD'}</Text>
      </View>
    </View>
  );

  if (isPdf && variant === 'grid') {
    return (
      <TouchableOpacity
        style={[
          styles.pdfGridCard,
          {
            backgroundColor: isWatched ? `${colors.green}08` : colors.bgCard,
            borderColor: isWatched ? colors.greenDim : colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.78}
      >
        <View style={styles.pdfGridAccentBar} />
        <View style={styles.pdfGridHeader}>
          <View style={styles.pdfDocIconWrap}>
            <FileText size={16} color="#d97706" />
          </View>
          <View style={styles.pdfPillChip}>
            <Text style={styles.pdfPillChipText}>PDF {indexLabel}</Text>
          </View>
        </View>

        <Text
          style={[
            styles.gridLabel,
            { color: isWatched ? colors.textMuted : colors.text },
          ]}
          numberOfLines={2}
        >
          {item.label}
        </Text>

        <View style={styles.gridFooter}>
          <Text style={[styles.gridSubject, { color: colors.textDim }]} numberOfLines={1}>
            {item.subject || 'PDF Notes'}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleWatched?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CheckCircle2
              size={16}
              color={isWatched ? colors.green : colors.border}
              fill={isWatched ? `${colors.green}20` : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            backgroundColor: isWatched ? `${colors.green}08` : colors.bgCard,
            borderColor: isWatched ? colors.greenDim : colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.78}
      >
        {renderThumbnail(true)}

        <View style={styles.gridBody}>
          <Text
            style={[
              styles.gridLabel,
              { color: isWatched ? colors.textMuted : colors.text },
            ]}
            numberOfLines={2}
          >
            {item.label}
          </Text>

          <View style={styles.gridFooter}>
            <Text style={[styles.gridSubject, { color: colors.textDim }]} numberOfLines={1}>
              {item.subject || `Class ${index + 1}`}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleWatched?.();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <CheckCircle2
                size={16}
                color={isWatched ? colors.green : colors.border}
                fill={isWatched ? `${colors.green}20` : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (isPdf) {
    return (
      <TouchableOpacity
        style={[
          styles.pdfRow,
          {
            backgroundColor: isWatched ? `${colors.green}08` : colors.bgCard,
            borderColor: isWatched ? colors.greenDim : colors.borderSubtle,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.pdfListIconBox}>
          <FileText size={18} color="#d97706" />
          <Text style={styles.pdfListMicroTag}>PDF</Text>
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
            {item.subject || 'PDF Document'} • #{index + 1}
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
  }

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
      {renderThumbnail(false)}

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
  listThumbBox: {
    width: 106,
    height: 60,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: spacing.md,
    position: 'relative',
  },
  gridCard: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridThumbBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    position: 'relative',
  },
  gridBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
    justifyContent: 'space-between',
  },
  gridLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  gridSubject: {
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  thumbImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    paddingHorizontal: 7,
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
    height: 3,
  },
  slideGlowOrb: {
    position: 'absolute',
    right: -12,
    bottom: -14,
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  slideGlowOrbSecondary: {
    position: 'absolute',
    left: -18,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.45,
  },
  slideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slideIndexChip: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  slideEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slidePlayMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitleText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 12,
    paddingRight: 24,
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
  pdfRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: 7,
  },
  pdfListIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    gap: 1,
  },
  pdfListMicroTag: {
    color: '#d97706',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pdfGridCard: {
    flex: 1,
    maxWidth: '48.8%',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 11,
    marginBottom: 10,
    gap: 8,
    justifyContent: 'space-between',
    position: 'relative',
  },
  pdfGridAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#d97706',
  },
  pdfGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  pdfDocIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfPillChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(217, 119, 6, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  pdfPillChipText: {
    color: '#d97706',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
