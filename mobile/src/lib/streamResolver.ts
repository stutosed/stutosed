import { API_BASE_URL } from './config';
import { LectureItem, ServerOption } from '../types';

const CLOUDFLARE_WORKER_URL = 'https://seiryu.stutosed.workers.dev';

export interface ResolvedMobileMedia {
  mode: 'native-video' | 'abyss' | 'youtube' | 'pdf' | 'webview';
  rawUrl: string;
  resolvedUrl: string;
  needsApiResolution: boolean;
  provider?: 'vidmoly' | 'earnvids';
  code?: string;
}

function resolveDirectMediaUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return '';
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    return url;
  }
  if (url.includes('herokuapp.com')) {
    const idMatch = url.match(/\/dl\/([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://publicbotshub.blogspot.com/p/file-stream-bot.html?watch=${idMatch[1]}`;
    }
  }
  return url;
}

export function getWorkerProxyUrl(targetUrl: string): string {
  if (!targetUrl) return '';
  const resolved = resolveDirectMediaUrl(targetUrl);
  return `${CLOUDFLARE_WORKER_URL}/?url=${encodeURIComponent(resolved)}`;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function extractVidmolyCode(url: string): string | null {
  const m = url.match(/(?:embed-|vidmoly\.[a-z]+\/)([a-zA-Z0-9]+)/i);
  return m ? m[1].replace(/\.html$/i, '') : null;
}

function extractEarnvidsCode(url: string): string | null {
  const m = url.match(/(?:\/v\/|\/e\/|\/f\/)([a-zA-Z0-9]+)/i);
  return m ? m[1] : null;
}

export function resolveMobileMedia(
  lecture: LectureItem,
  selectedServer?: ServerOption | null
): ResolvedMobileMedia {
  const rawUrl = (
    selectedServer?.url ||
    lecture.links?.url ||
    lecture.servers?.[0]?.url ||
    lecture.url ||
    ''
  ).trim();

  const lowerUrl = rawUrl.toLowerCase();
  const serverType = (selectedServer?.type || lecture.servers?.[0]?.type || '').toLowerCase();

  // 1. Abyss Embed (cross-origin provider player — rendered via WebView iframe wrapper + Liquid Glass frame)
  const isAbyss =
    lowerUrl.includes('abyssplayer.com') ||
    lowerUrl.includes('abyss.to') ||
    lecture.type === 'abyss' ||
    serverType === 'abyss';

  if (isAbyss) {
    let resolved = rawUrl;
    if (!lowerUrl.includes('player.abyssplayer.com')) {
      const match = rawUrl.match(
        /(?:abyss\.to\/|abyssplayer\.com\/|files\/)([a-zA-Z0-9_-]{8,15})/
      );
      const fileId = match ? match[1] : lecture.id || '';
      if (fileId) {
        resolved = `https://player.abyssplayer.com/${fileId}`;
      }
    }
    return {
      mode: 'abyss',
      rawUrl,
      resolvedUrl: resolved,
      needsApiResolution: false,
    };
  }

  // 2. PDF Documents (PDF notes, handwritten notes, quizzes, or image attachments)
  if (
    lecture.type === 'pdf' ||
    lecture.category === 'pdfs' ||
    serverType === 'pdf' ||
    lowerUrl.endsWith('.pdf') ||
    lowerUrl.includes('.pdf?')
  ) {
    const directUrl = resolveDirectMediaUrl(rawUrl);
    return {
      mode: 'pdf',
      rawUrl: directUrl,
      resolvedUrl: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(directUrl)}`,
      needsApiResolution: false,
    };
  }

  // 3. YouTube Embed
  const ytId = extractYouTubeId(rawUrl);
  if (ytId) {
    return {
      mode: 'youtube',
      rawUrl,
      resolvedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      needsApiResolution: false,
    };
  }

  // 4. Direct Native Video Streams (HLS .m3u8, MP4, MKV, Worker Proxy, Vidmoly, Earnvids)
  const isHls = lowerUrl.includes('.m3u8') || lecture.type === 'hls';
  const isProxyStream =
    lowerUrl.includes('workers.dev') ||
    lowerUrl.includes('publicbotshub') ||
    lowerUrl.includes('herokuapp.com') ||
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.mkv') ||
    lowerUrl.endsWith('.webm');

  if (isProxyStream) {
    return {
      mode: 'native-video',
      rawUrl,
      resolvedUrl: getWorkerProxyUrl(rawUrl),
      needsApiResolution: false,
    };
  }

  if (isHls) {
    const resolvedUrl = lowerUrl.includes('hranker.com')
      ? `${API_BASE_URL}/api/v1/hls-proxy?url=${encodeURIComponent(rawUrl)}&provider=hranker`
      : rawUrl;
    return {
      mode: 'native-video',
      rawUrl,
      resolvedUrl,
      needsApiResolution: false,
    };
  }

  if (lowerUrl.includes('vidmoly.')) {
    const code = extractVidmolyCode(rawUrl);
    if (code) {
      return {
        mode: 'native-video',
        rawUrl,
        resolvedUrl: '',
        needsApiResolution: true,
        provider: 'vidmoly',
        code,
      };
    }
  }

  if (lowerUrl.includes('morencius.') || lowerUrl.includes('earnvids.')) {
    const code = extractEarnvidsCode(rawUrl);
    if (code) {
      return {
        mode: 'native-video',
        rawUrl,
        resolvedUrl: '',
        needsApiResolution: true,
        provider: 'earnvids',
        code,
      };
    }
  }

  // 5. Fallback WebView for StreamP2P or unknown external links
  return {
    mode: 'webview',
    rawUrl,
    resolvedUrl: rawUrl,
    needsApiResolution: false,
  };
}

export async function fetchResolvedStreamUrl(
  provider: 'vidmoly' | 'earnvids',
  code: string,
  signal?: AbortSignal
): Promise<string | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/stream?code=${encodeURIComponent(code)}&provider=${provider}`,
    { signal }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const streamUrl = json?.data?.streamUrl || json?.streamUrl;
  if (!streamUrl || typeof streamUrl !== 'string') return null;
  return streamUrl.startsWith('/') ? `${API_BASE_URL}${streamUrl}` : streamUrl;
}
