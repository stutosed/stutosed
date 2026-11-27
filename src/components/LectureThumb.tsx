'use client';

import React, { useState, useMemo } from 'react';
import { LectureItem } from '@/types';
import { FileText, Play } from 'lucide-react';

const SLIDE_THEMES: Array<{ bg: string; glow: string; accent: string; pillBg: string }> = [
  { bg: '#6b2d1c', glow: 'rgba(244, 162, 132, 0.28)', accent: '#f6a88e', pillBg: 'rgba(20, 10, 8, 0.48)' },
  { bg: '#263163', glow: 'rgba(129, 140, 248, 0.30)', accent: '#a5b4fc', pillBg: 'rgba(12, 16, 36, 0.48)' },
  { bg: '#13465e', glow: 'rgba(56, 189, 248, 0.28)', accent: '#7dd3fc', pillBg: 'rgba(8, 24, 34, 0.48)' },
  { bg: '#164d3b', glow: 'rgba(52, 211, 153, 0.26)', accent: '#6ee7b7', pillBg: 'rgba(8, 28, 22, 0.48)' },
  { bg: '#572043', glow: 'rgba(244, 114, 182, 0.28)', accent: '#f9a8d4', pillBg: 'rgba(28, 8, 22, 0.48)' },
  { bg: '#5c3814', glow: 'rgba(251, 191, 36, 0.28)', accent: '#fcd34d', pillBg: 'rgba(28, 18, 6, 0.48)' },
];

function hashThumbSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getYouTubeThumbUrl(item: Partial<LectureItem>): string | null {
  const url = item.links?.url || item.servers?.[0]?.url || item.url || '';
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function isUnreliablePosterUrl(url: string): boolean {
  const lower = url.toLowerCase();
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

export function isPdfItem(item: Partial<LectureItem>): boolean {
  return (
    item.type === 'pdf' ||
    item.category === 'pdfs' ||
    (item.url || '').toLowerCase().endsWith('.pdf')
  );
}

export const LectureThumb: React.FC<{
  item: Partial<LectureItem>;
  index: number;
  isWatched?: boolean;
  variant: 'grid' | 'list' | 'compact';
}> = ({ item, index, isWatched = false, variant }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const isPdf = isPdfItem(item);

  const remoteThumb = useMemo(() => {
    const candidate = item.thumb || item.preview;
    if (candidate && candidate.startsWith('http') && !isUnreliablePosterUrl(candidate)) {
      return candidate;
    }
    return getYouTubeThumbUrl(item);
  }, [item]);

  const themePalette = useMemo(
    () => SLIDE_THEMES[hashThumbSeed(`${item.label || ''}-${index}`) % SLIDE_THEMES.length],
    [item.label, index]
  );

  const headline = useMemo(() => getSlideHeadline(item.label || ''), [item.label]);
  const indexLabel = String(index + 1).padStart(2, '0');
  const isGrid = variant === 'grid';
  const isCompact = variant === 'compact';

  const thumbWidth = isGrid ? '100%' : isCompact ? '96px' : '116px';
  const thumbHeight = isGrid ? undefined : isCompact ? '54px' : '65px';

  return (
    <div
      className={isGrid ? 'lecture-thumb-grid-box' : undefined}
      style={{
        position: 'relative',
        width: thumbWidth,
        height: thumbHeight,
        borderRadius: isGrid ? '0' : '8px',
        overflow: 'hidden',
        flexShrink: 0,
        background: themePalette.bg,
        border: isGrid ? 'none' : '1px solid rgba(255, 255, 255, 0.14)',
      }}
    >
      {/* Always render readable classroom slide underneath so failed/slow images never show black */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: isGrid ? '12px 14px' : isCompact ? '5px 7px' : '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isCompact ? '2.5px' : '3px',
            background: themePalette.accent,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-14px',
            bottom: '-14px',
            width: isGrid ? '92px' : isCompact ? '44px' : '52px',
            height: isGrid ? '92px' : isCompact ? '44px' : '52px',
            borderRadius: '50%',
            background: themePalette.glow,
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <span
            style={{
              padding: isGrid ? '2px 7px' : '1px 4px',
              borderRadius: '4px',
              background: themePalette.pillBg,
              color: themePalette.accent,
              fontSize: isGrid ? '10px' : isCompact ? '7.5px' : '8.5px',
              fontWeight: 800,
              letterSpacing: '0.4px',
            }}
          >
            {isPdf ? `PDF ${indexLabel}` : `LEC ${indexLabel}`}
          </span>
          <span
            style={{
              width: isGrid ? '28px' : isCompact ? '16px' : '18px',
              height: isGrid ? '28px' : isCompact ? '16px' : '18px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.34)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            {isPdf ? (
              <FileText width={isGrid ? 13 : 8} height={isGrid ? 13 : 8} />
            ) : (
              <Play
                width={isGrid ? 12 : 8}
                height={isGrid ? 12 : 8}
                fill="currentColor"
                style={{ transform: 'translateX(1px)' }}
              />
            )}
          </span>
        </div>

        <div
          style={{
            color: '#ffffff',
            fontSize: isGrid ? '13.5px' : isCompact ? '8.5px' : '9.5px',
            fontWeight: 700,
            lineHeight: isGrid ? 1.32 : 1.2,
            paddingRight: isGrid ? '28px' : '18px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {headline}
        </div>
      </div>

      {remoteThumb && !imgFailed && (
        <img
          src={remoteThumb}
          alt={item.label || 'Lecture thumbnail'}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      <span
        style={{
          position: 'absolute',
          bottom: isGrid ? '7px' : '3px',
          right: isGrid ? '8px' : '3px',
          padding: isGrid ? '2px 6px' : '1px 4px',
          borderRadius: '4px',
          background: isPdf
            ? 'rgba(217, 119, 6, 0.92)'
            : isWatched
            ? 'rgba(22, 163, 74, 0.92)'
            : 'rgba(0, 0, 0, 0.64)',
          color: '#ffffff',
          fontSize: isGrid ? '9.5px' : '7.5px',
          fontWeight: 800,
          letterSpacing: '0.3px',
          zIndex: 2,
        }}
      >
        {isPdf ? 'PDF' : isWatched ? 'DONE' : 'HD'}
      </span>
    </div>
  );
};
