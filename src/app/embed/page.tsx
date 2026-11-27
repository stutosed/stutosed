'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

const ALLOWED_EMBED_HOSTS = [
  'player.abyssplayer.com',
  'abyss.to',
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
];

function isSafeEmbedUrl(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_EMBED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

function EmbedFrameInner() {
  const searchParams = useSearchParams();
  const src = searchParams.get('src') || '';

  const safeSrc = useMemo(() => (isSafeEmbedUrl(src) ? src : ''), [src]);

  useEffect(() => {
    const notifyFullscreen = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
      };
      const active = Boolean(
        document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement
      );
      const rnWebView = (
        window as Window & { ReactNativeWebView?: { postMessage: (msg: string) => void } }
      ).ReactNativeWebView;
      if (rnWebView) {
        rnWebView.postMessage(JSON.stringify({ type: 'fullscreen', active }));
      }
    };

    document.addEventListener('fullscreenchange', notifyFullscreen, true);
    document.addEventListener('webkitfullscreenchange', notifyFullscreen, true);
    document.addEventListener('mozfullscreenchange', notifyFullscreen, true);
    return () => {
      document.removeEventListener('fullscreenchange', notifyFullscreen, true);
      document.removeEventListener('webkitfullscreenchange', notifyFullscreen, true);
      document.removeEventListener('mozfullscreenchange', notifyFullscreen, true);
    };
  }, []);

  if (!safeSrc) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
        }}
      >
        Invalid or unsupported embed source.
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, background: '#000', overflow: 'hidden' }}>
      <iframe
        src={safeSrc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#000' }} />}>
      <EmbedFrameInner />
    </Suspense>
  );
}
