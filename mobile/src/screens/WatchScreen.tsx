import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
  StatusBar,
  ScrollView,
  Image,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewMessageEvent,
} from 'react-native-webview/lib/WebViewTypes';
import * as ScreenOrientation from 'expo-screen-orientation';
import { BlurView } from 'expo-blur';
import { RootStackParamList, LectureItem, ServerOption } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { API_BASE_URL } from '../lib/config';
import { loadCourseDetails } from '../data/coursesData';
import { resolveMobileMedia, fetchResolvedStreamUrl, getWorkerProxyUrl } from '../lib/streamResolver';
import { LiquidGlassVideoPlayer } from '../components/LiquidGlassVideoPlayer';
import { LectureRow } from '../components/LectureRow';
import { spacing, radii } from '../theme/spacing';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  X,
  FileText,
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  FolderHeart,
  Share2,
  Send,
  Download,
  ExternalLink,
  ListVideo,
} from 'lucide-react-native';

type WatchRouteProp = RouteProp<RootStackParamList, 'Watch'>;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isPdfLecture(item: LectureItem): boolean {
  return (
    item.type === 'pdf' ||
    item.category === 'pdfs' ||
    (item.url || '').toLowerCase().endsWith('.pdf')
  );
}

const AD_BLOCK_HOST_FRAGMENTS = [
  'decafeligiblyhad',
  'doubleclick.net',
  'googlesyndication',
  'popads',
  'popcash',
  'propellerads',
  'adsterra',
  'exoclick',
];

const FULLSCREEN_BRIDGE_JS = `
(function() {
  if (window.__stutosedFsHooked) return;
  window.__stutosedFsHooked = true;
  function notifyFs() {
    var active = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen', active: active }));
    }
  }
  document.addEventListener('fullscreenchange', notifyFs, true);
  document.addEventListener('webkitfullscreenchange', notifyFs, true);
  document.addEventListener('mozfullscreenchange', notifyFs, true);
})();
true;
`;

export const WatchScreen: React.FC = () => {
  const route = useRoute<WatchRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const {
    watchedMap,
    bookmarks,
    savedVideos,
    toggleLectureWatched,
    markLectureWatched,
    recordCourseMemory,
    toggleCourseBookmark,
    toggleSaveVideo,
  } = useAuth();

  const { lecture: initialLecture, courseId, courseTitle, tabId, playlist: paramPlaylist, initialIndex } =
    route.params;

  const [playlist, setPlaylist] = useState<LectureItem[]>(
    paramPlaylist && paramPlaylist.length > 0 ? paramPlaylist : [initialLecture]
  );
  const [currentIdx, setCurrentIdx] = useState<number>(
    paramPlaylist && paramPlaylist.length > 0 ? Math.max(0, initialIndex || 0) : 0
  );

  // If opened from Home/Library without playlist, hydrate the full section playlist from course catalog
  useEffect(() => {
    if (paramPlaylist && paramPlaylist.length > 1) {
      setPlaylist(paramPlaylist);
      setCurrentIdx(Math.max(0, initialIndex || 0));
      return;
    }
    if (!courseId || isPdfLecture(initialLecture)) return;

    let active = true;
    loadCourseDetails(courseId).then((course) => {
      if (!active || !course) return;
      let candidateItems: LectureItem[] = [];
      if (course.tabs && course.tabs.length > 0) {
        const matchedTab =
          (tabId ? course.tabs.find((t) => t.id === tabId) : null) ||
          course.tabs.find((t) =>
            t.items.some(
              (it) =>
                (it.id && it.id === initialLecture.id) ||
                (it.url && it.url === initialLecture.url)
            )
          ) ||
          course.tabs[0];
        candidateItems = (matchedTab?.items || []).filter((i) => !isPdfLecture(i));
      } else if (course.isPratham && course.prathamBySubject) {
        const list =
          (tabId ? course.prathamBySubject[tabId] : null) ||
          Object.values(course.prathamBySubject).find((arr) =>
            arr.some((it) => it.url === initialLecture.url)
          ) ||
          [];
        candidateItems = list.filter((i) => !isPdfLecture(i));
      }

      if (candidateItems.length > 0) {
        const foundIdx = candidateItems.findIndex(
          (it) =>
            (initialLecture.id && it.id === initialLecture.id) ||
            (initialLecture.url && it.url === initialLecture.url)
        );
        setPlaylist(candidateItems);
        if (foundIdx >= 0) setCurrentIdx(foundIdx);
      }
    });

    return () => {
      active = false;
    };
  }, [courseId, tabId, initialLecture, paramPlaylist, initialIndex]);

  const lecture = playlist[currentIdx] || initialLecture;

  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isManualFullscreen, setIsManualFullscreen] = useState(false);
  const [showUpperOverlay, setShowUpperOverlay] = useState(false);
  const [apiStreamUrl, setApiStreamUrl] = useState<string | null>(null);
  const [nativeFallbackToWebView, setNativeFallbackToWebView] = useState(false);
  const [embedFallbackToInlineHtml, setEmbedFallbackToInlineHtml] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const { refreshControl } = usePullToRefresh(() => {
    setPdfLoadError(false);
    setEmbedFallbackToInlineHtml(false);
    setLoading(true);
    setWebViewKey((k) => k + 1);
  });

  const isLandscape = width > height;
  const isExpandedPlayer = isLandscape || isManualFullscreen;

  const servers: ServerOption[] = useMemo(() => {
    if (!lecture.servers || lecture.servers.length === 0) return [];
    const seen = new Set<string>();
    const out: ServerOption[] = [];
    for (const s of lecture.servers) {
      const k = s.url?.trim().toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    }
    return out;
  }, [lecture]);

  const activeServer = servers[selectedServerIdx] || servers[0] || null;

  const mediaConfig = useMemo(
    () => resolveMobileMedia(lecture, activeServer),
    [lecture, activeServer]
  );

  // Unlock orientation while watching a lecture, restore portrait cleanly on exit
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // Resolve Vidmoly/Earnvids streams via backend API when needed
  useEffect(() => {
    setNativeFallbackToWebView(false);
    setApiStreamUrl(null);

    if (!mediaConfig.needsApiResolution || !mediaConfig.provider || !mediaConfig.code) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchResolvedStreamUrl(mediaConfig.provider, mediaConfig.code, controller.signal)
      .then((url) => {
        if (url) {
          setApiStreamUrl(url);
        } else {
          setNativeFallbackToWebView(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setNativeFallbackToWebView(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [mediaConfig]);

  const exitLandscapeFullscreen = useCallback(async () => {
    setIsManualFullscreen(false);
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setTimeout(() => {
        ScreenOrientation.unlockAsync().catch(() => {});
      }, 350);
    } catch {}
  }, []);

  const toggleManualFullscreen = useCallback(async () => {
    if (isExpandedPlayer) {
      await exitLandscapeFullscreen();
    } else {
      setIsManualFullscreen(true);
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
    }
  }, [isExpandedPlayer, exitLandscapeFullscreen]);

  // Android Back exits landscape fullscreen back to portrait first
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isManualFullscreen) {
        exitLandscapeFullscreen();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isManualFullscreen, exitLandscapeFullscreen]);

  const watchKey =
    lecture.url ||
    lecture.links?.url ||
    lecture.servers?.[0]?.url ||
    mediaConfig.rawUrl ||
    lecture.id ||
    '';
  const isWatched = [
    watchKey,
    mediaConfig.rawUrl,
    lecture.url,
    lecture.links?.url,
    ...(lecture.servers?.map((s) => s.url) || []),
    lecture.id,
  ].some((k) => Boolean(k && watchedMap[k]));

  const isBookmarked = Boolean(courseId && bookmarks.includes(courseId));
  const isSaved = savedVideos.some(
    (v) => v.id === (lecture.id || watchKey) || v.url === watchKey || v.url === lecture.url
  );

  const finalNativeStreamUrl =
    mediaConfig.mode === 'native-video' && !nativeFallbackToWebView
      ? mediaConfig.needsApiResolution
        ? apiStreamUrl
        : mediaConfig.resolvedUrl
      : null;

  const isNativeVideoActive = Boolean(finalNativeStreamUrl);
  const isPdfMode = mediaConfig.mode === 'pdf';
  const useIframeWrapper = mediaConfig.mode === 'abyss' || mediaConfig.mode === 'youtube';

  const pdfDirectUrl = mediaConfig.rawUrl || lecture.downloadUrl || lecture.url || '';
  const pdfProxiedUrl = useMemo(
    () => (pdfDirectUrl ? getWorkerProxyUrl(pdfDirectUrl) : ''),
    [pdfDirectUrl]
  );
  const isPdfImageNote = useMemo(() => {
    const check = `${lecture.label || ''} ${pdfDirectUrl}`.toLowerCase();
    return /\.(png|jpe?g|webp)(\?|$)/i.test(check);
  }, [lecture.label, pdfDirectUrl]);

  const activePdfViewerUrl = useMemo(() => {
    if (!pdfDirectUrl) return '';
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfDirectUrl)}`;
  }, [pdfDirectUrl]);

  // Safety auto-dismiss PDF loading spinner so streaming PDFs stay immediately visible
  useEffect(() => {
    if (!isPdfMode || !loading) return;
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, [isPdfMode, loading, webViewKey, selectedServerIdx]);

  const handleSelectPlaylistLecture = useCallback(
    (idx: number) => {
      const target = playlist[idx];
      if (!target) return;
      setCurrentIdx(idx);
      setSelectedServerIdx(0);
      setLoading(true);
      setWebViewKey((k) => k + 1);

      const targetKey =
        target.url || target.links?.url || target.servers?.[0]?.url || target.id || '';
      if (targetKey) {
        markLectureWatched(courseId, targetKey);
        recordCourseMemory({
          courseId,
          courseName: courseTitle,
          lectureTitle: target.label,
          tabId: tabId || 'videos',
          url: targetKey,
          timestamp: Date.now(),
        });
      }
    },
    [playlist, courseId, courseTitle, tabId, markLectureWatched, recordCourseMemory]
  );

  const handleShareLecture = useCallback(async () => {
    try {
      const webShareUrl = `https://web.stutosed.workers.dev/watch?course=${encodeURIComponent(courseId)}&index=${currentIdx}`;
      await Share.share({
        message: `${lecture.label} — ${courseTitle}\n${webShareUrl}`,
        title: lecture.label,
      });
    } catch {}
  }, [courseId, currentIdx, lecture.label, courseTitle]);

  useEffect(() => {
    setEmbedFallbackToInlineHtml(false);
  }, [currentIdx, selectedServerIdx, lecture?.url]);

  const iframeWrapperHtml = useMemo(() => {
    const safeSrc = escapeHtmlAttr(mediaConfig.resolvedUrl);
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
      iframe { width: 100%; height: 100%; border: none; display: block; }
    </style>
  </head>
  <body>
    <iframe
      id="stutosed-player-frame"
      src="${safeSrc}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen
      webkitallowfullscreen
      mozallowfullscreen
    ></iframe>
    <script>
      (function() {
        function notifyFs() {
          var active = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen', active: active }));
          }
        }
        document.addEventListener('fullscreenchange', notifyFs, true);
        document.addEventListener('webkitfullscreenchange', notifyFs, true);
        document.addEventListener('mozfullscreenchange', notifyFs, true);
      })();
    </script>
  </body>
</html>`;
  }, [mediaConfig.resolvedUrl]);

  const embedPageUrl = useMemo(() => {
    if (!mediaConfig.resolvedUrl) return '';
    return `${API_BASE_URL.replace(/\/+$/, '')}/embed?src=${encodeURIComponent(mediaConfig.resolvedUrl)}`;
  }, [mediaConfig.resolvedUrl]);

  const webViewSource = useMemo(() => {
    if (!useIframeWrapper) {
      return { uri: mediaConfig.resolvedUrl };
    }
    if (!embedFallbackToInlineHtml && embedPageUrl) {
      return { uri: embedPageUrl };
    }
    return { html: iframeWrapperHtml, baseUrl: `${API_BASE_URL}/` };
  }, [useIframeWrapper, embedFallbackToInlineHtml, embedPageUrl, iframeWrapperHtml, mediaConfig.resolvedUrl]);

  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}');
      if (payload?.type === 'fullscreen') {
        if (payload.active) {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
          ).catch(() => {});
        } else {
          await exitLandscapeFullscreen();
        }
      }
    } catch {}
  };

  const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
    const reqUrl = (request.url || '').toLowerCase();

    if (AD_BLOCK_HOST_FRAGMENTS.some((frag) => reqUrl.includes(frag))) {
      return false;
    }

    if (useIframeWrapper) {
      if (reqUrl === 'about:blank' || reqUrl.startsWith(API_BASE_URL.toLowerCase())) {
        return true;
      }
      if (request.isTopFrame) {
        return false;
      }
      return true;
    }

    return true;
  };

  const playerBoxStyle = isExpandedPlayer
    ? { width, height, backgroundColor: '#000000' }
    : { width, height: (width * 9) / 16, backgroundColor: '#000000' };

  if (isPdfMode) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.bg }]}
        edges={['top', 'bottom']}
      >
        <StatusBar hidden={false} />

        {/* Dedicated PDF Reader Header */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.pdfTitleRow}>
              <View
                style={[
                  styles.pdfBadgeChip,
                  {
                    backgroundColor: 'rgba(217, 119, 6, 0.14)',
                    borderColor: 'rgba(217, 119, 6, 0.35)',
                  },
                ]}
              >
                <FileText size={10} color="#d97706" />
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <Text style={[styles.lectureTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {lecture.label}
              </Text>
            </View>
            <Text style={[styles.courseSubtitle, { color: colors.textDim }]} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.pdfHeaderIconBtn,
              {
                backgroundColor: isWatched ? `${colors.green}18` : colors.bgCardSubtle,
                borderColor: isWatched ? colors.green : colors.borderSubtle,
              },
            ]}
            onPress={() => toggleLectureWatched(courseId, watchKey)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CheckCircle2 size={16} color={isWatched ? colors.green : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pdfHeaderIconBtn,
              { backgroundColor: colors.bgCardSubtle, borderColor: colors.borderSubtle },
            ]}
            onPress={() => {
              setPdfLoadError(false);
              setLoading(true);
              setWebViewKey((k) => k + 1);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* PDF Source Switcher & Quick Action Buttons (Download + Filetosed Bot + Stream Bot) */}
        <View
          style={[
            styles.pdfToolbar,
            { backgroundColor: colors.bgCardSubtle, borderBottomColor: colors.borderSubtle },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pdfToolbarScroll}
          >
            {!isPdfImageNote &&
              servers.length > 1 &&
              servers.map((srv, idx) => {
                const active = idx === selectedServerIdx;
                return (
                  <TouchableOpacity
                    key={`pdf-srv-${idx}`}
                    style={[
                      styles.pdfEngineChip,
                      {
                        backgroundColor: active ? `${colors.accent}20` : colors.bgCard,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedServerIdx(idx);
                      setPdfLoadError(false);
                      setLoading(true);
                      setWebViewKey((k) => k + 1);
                    }}
                  >
                    <Text
                      style={[
                        styles.pdfEngineText,
                        { color: active ? colors.accent : colors.textMuted },
                      ]}
                    >
                      {srv.name || `Source ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            {Boolean(lecture.downloadUrl || pdfDirectUrl || pdfProxiedUrl) && (
              <TouchableOpacity
                style={[
                  styles.pdfEngineChip,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => {
                  const dl = lecture.downloadUrl || pdfDirectUrl || pdfProxiedUrl;
                  if (dl) Linking.openURL(dl).catch(() => {});
                }}
              >
                <Download size={12} color="#ffffff" />
                <Text style={[styles.pdfEngineText, { color: '#ffffff' }]}>
                  Download PDF
                </Text>
              </TouchableOpacity>
            )}

            {Boolean(lecture.fileStoreUrl) && (
              <TouchableOpacity
                style={[
                  styles.pdfEngineChip,
                  {
                    backgroundColor: 'rgba(0, 136, 204, 0.14)',
                    borderColor: 'rgba(0, 136, 204, 0.38)',
                  },
                ]}
                onPress={() => {
                  if (lecture.fileStoreUrl) Linking.openURL(lecture.fileStoreUrl).catch(() => {});
                }}
              >
                <Send size={12} color="#0088cc" />
                <Text style={[styles.pdfEngineText, { color: '#0088cc' }]}>
                  Get File on Filetosed
                </Text>
              </TouchableOpacity>
            )}

            {Boolean(lecture.streamBotUrl) && (
              <TouchableOpacity
                style={[
                  styles.pdfEngineChip,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (lecture.streamBotUrl) Linking.openURL(lecture.streamBotUrl).catch(() => {});
                }}
              >
                <ExternalLink size={12} color={colors.textMuted} />
                <Text style={[styles.pdfEngineText, { color: colors.text }]}>
                  File Stream Bot
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Full-Height PDF Reading Canvas */}
        <View style={[styles.pdfCanvas, { backgroundColor: colors.bg }]}>
          {isPdfImageNote ? (
            <ScrollView
              contentContainerStyle={styles.pdfImageScroll}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
            >
              <Image
                source={{ uri: pdfProxiedUrl || pdfDirectUrl }}
                style={{ width: width - 16, height: Math.max(height * 0.78, 420) }}
                resizeMode="contain"
                onLoadEnd={() => setLoading(false)}
              />
            </ScrollView>
          ) : (
            <>
              <WebView
                key={`pdf-${webViewKey}-${selectedServerIdx}`}
                source={{ uri: activePdfViewerUrl }}
                style={styles.pdfWebView}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="compatibility"
                scalesPageToFit
                builtInZoomControls
                displayZoomControls={false}
                setSupportMultipleWindows={false}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setPdfLoadError(true);
                }}
              />

              {loading && (
                <View style={[styles.pdfLoadingOverlay, { backgroundColor: colors.bg }]}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={[styles.pdfLoadingTitle, { color: colors.text }]}>
                    Opening PDF Document...
                  </Text>
                </View>
              )}

              {pdfLoadError && !loading && (
                <View
                  style={[
                    styles.pdfErrorBanner,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.pdfErrorText, { color: colors.text }]}>
                    PDF preview load nahi ho paaya. Reload try karein.
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.pdfFallbackBtn, { backgroundColor: colors.accent }]}
                      onPress={() => {
                        setPdfLoadError(false);
                        setLoading(true);
                        setWebViewKey((k) => k + 1);
                      }}
                    >
                      <Text style={styles.pdfFallbackBtnText}>Reload PDF</Text>
                    </TouchableOpacity>
                    {Boolean(lecture.downloadUrl || pdfDirectUrl) && (
                      <TouchableOpacity
                        style={[styles.pdfFallbackBtn, { backgroundColor: '#1f2937' }]}
                        onPress={() => {
                          const dl = lecture.downloadUrl || pdfDirectUrl;
                          if (dl) Linking.openURL(dl).catch(() => {});
                        }}
                      >
                        <Text style={styles.pdfFallbackBtnText}>Download PDF</Text>
                      </TouchableOpacity>
                    )}
                    {Boolean(lecture.fileStoreUrl) && (
                      <TouchableOpacity
                        style={[styles.pdfFallbackBtn, { backgroundColor: '#0088cc' }]}
                        onPress={() => {
                          if (lecture.fileStoreUrl) Linking.openURL(lecture.fileStoreUrl).catch(() => {});
                        }}
                      >
                        <Text style={styles.pdfFallbackBtnText}>Get File on Filetosed</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isExpandedPlayer ? '#000000' : colors.bg }]}
      edges={isExpandedPlayer ? [] : ['top']}
    >
      <StatusBar hidden={isExpandedPlayer} />

      {/* Top Header (Hidden in Landscape / Fullscreen) */}
      {!isExpandedPlayer && (
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.lectureTitle, { color: colors.text }]} numberOfLines={1}>
              {lecture.label}
            </Text>
            <Text style={[styles.courseSubtitle, { color: colors.textDim }]} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reloadBtn}
            onPress={toggleManualFullscreen}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Maximize2 size={17} color={colors.textMuted} />
          </TouchableOpacity>
          {!isNativeVideoActive && (
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => {
                setLoading(true);
                setWebViewKey((k) => k + 1);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RefreshCw size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Player Container */}
      <View style={[styles.playerContainer, playerBoxStyle]}>
        {isNativeVideoActive && finalNativeStreamUrl ? (
          <LiquidGlassVideoPlayer
            key={`${finalNativeStreamUrl}-${selectedServerIdx}-${currentIdx}`}
            sourceUrl={finalNativeStreamUrl}
            title={lecture.label}
            isFullscreen={isExpandedPlayer}
            onToggleFullscreen={toggleManualFullscreen}
            onPlaybackError={() => {
              setNativeFallbackToWebView(true);
              setLoading(true);
            }}
          />
        ) : mediaConfig.needsApiResolution && !nativeFallbackToWebView ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Preparing Stream...
            </Text>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Connecting to High-Speed Stream...
                </Text>
              </View>
            )}

            <WebView
              key={`${webViewKey}-${selectedServerIdx}-${currentIdx}-${embedFallbackToInlineHtml ? 'html' : 'url'}`}
              source={webViewSource}
              style={styles.webView}
              userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              allowsProtectedMedia
              cacheEnabled
              mixedContentMode="always"
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              injectedJavaScript={FULLSCREEN_BRIDGE_JS}
              onMessage={handleWebViewMessage}
              onLoadEnd={() => setLoading(false)}
              onHttpError={({ nativeEvent }) => {
                if (useIframeWrapper && !embedFallbackToInlineHtml && nativeEvent.statusCode >= 400) {
                  setEmbedFallbackToInlineHtml(true);
                  setLoading(true);
                  setWebViewKey((k) => k + 1);
                }
              }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              allowsInlineMediaPlayback
              setSupportMultipleWindows={false}
            />

            {/* CRWill-style Upper-Layer Toggle Overlay */}
            <View style={styles.upperLayerWrap} pointerEvents="box-none">
              {showUpperOverlay ? (
                <BlurView
                  intensity={48}
                  tint="dark"
                  blurMethod="dimezisBlurViewSdk31Plus"
                  style={styles.upperBarExpanded}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.upperCourseText} numberOfLines={1}>
                      {courseTitle}
                    </Text>
                    <Text style={styles.upperTitleText} numberOfLines={1}>
                      {lecture.label}
                    </Text>
                  </View>

                  <View style={styles.upperActions}>
                    <TouchableOpacity
                      style={styles.upperIconBtn}
                      onPress={() => {
                        setLoading(true);
                        setWebViewKey((k) => k + 1);
                      }}
                    >
                      <RefreshCw size={13} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.upperIconBtn,
                        isWatched && {
                          backgroundColor: 'rgba(34, 197, 94, 0.25)',
                          borderColor: 'rgba(34, 197, 94, 0.55)',
                        },
                      ]}
                      onPress={() => toggleLectureWatched(courseId, watchKey)}
                    >
                      <CheckCircle2 size={13} color={isWatched ? '#4ade80' : '#ffffff'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.upperIconBtn}
                      onPress={toggleManualFullscreen}
                    >
                      {isExpandedPlayer ? (
                        <Minimize2 size={13} color="#ffffff" />
                      ) : (
                        <Maximize2 size={13} color="#ffffff" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.upperIconBtn}
                      onPress={() => setShowUpperOverlay(false)}
                    >
                      <X size={13} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              ) : (
                <View style={styles.upperCollapsedRow} pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={() => setShowUpperOverlay(true)}
                    activeOpacity={0.8}
                  >
                    <BlurView
                      intensity={48}
                      tint="dark"
                      blurMethod="dimezisBlurViewSdk31Plus"
                      style={styles.upperTogglePill}
                    >
                      <SlidersHorizontal size={12} color="#ffffff" />
                      <Text style={styles.upperToggleText}>Controls</Text>
                    </BlurView>
                  </TouchableOpacity>

                  {isManualFullscreen && (
                    <TouchableOpacity
                      onPress={exitLandscapeFullscreen}
                      activeOpacity={0.8}
                    >
                      <BlurView
                        intensity={48}
                        tint="dark"
                        blurMethod="dimezisBlurViewSdk31Plus"
                        style={styles.upperTogglePill}
                      >
                        <Minimize2 size={12} color="#ffffff" />
                        <Text style={styles.upperToggleText}>Exit</Text>
                      </BlurView>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Native Player Fullscreen Exit Pill */}
        {isNativeVideoActive && isManualFullscreen && (
          <TouchableOpacity
            style={styles.exitFsPillWrap}
            onPress={exitLandscapeFullscreen}
            activeOpacity={0.82}
          >
            <BlurView
              intensity={52}
              tint="dark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.exitFsPill}
            >
              <Minimize2 size={14} color="#ffffff" />
              <Text style={styles.exitFsText}>Exit Fullscreen</Text>
            </BlurView>
          </TouchableOpacity>
        )}
      </View>

      {/* Details, Action Dock & Batch Lecture Queue (Hidden in Landscape / Fullscreen) */}
      {!isExpandedPlayer && (
        <ScrollView
          style={styles.detailsContainer}
          contentContainerStyle={{ paddingBottom: spacing.xxl, gap: 14 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Info & Action Buttons Card (Matching Web Mobile Player) */}
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            {/* Meta Chips Row */}
            <View style={styles.metaChipsRow}>
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: 'rgba(204,120,92,0.14)', borderColor: 'rgba(204,120,92,0.3)' },
                ]}
              >
                <Text style={[styles.metaChipText, { color: colors.accent }]} numberOfLines={1}>
                  {courseTitle}
                </Text>
              </View>
              {lecture.subject ? (
                <View
                  style={[
                    styles.metaChip,
                    { backgroundColor: colors.bgCardSubtle, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Text style={[styles.metaChipText, { color: colors.textMuted }]} numberOfLines={1}>
                    {lecture.subject}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metaChipText, { color: colors.textDim }]}>
                  Lecture {currentIdx + 1} of {playlist.length}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardLectureLabel, { color: colors.text }]}>{lecture.label}</Text>

            {/* Server Switcher Pills when multiple servers exist */}
            {servers.length > 1 && (
              <View style={styles.serverRow}>
                {servers.map((srv, idx) => {
                  const active = idx === selectedServerIdx;
                  return (
                    <TouchableOpacity
                      key={`${srv.url}-${idx}`}
                      style={[
                        styles.serverPill,
                        {
                          backgroundColor: active ? colors.accent : colors.bgCardSubtle,
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedServerIdx(idx);
                        setLoading(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.serverPillText,
                          { color: active ? '#ffffff' : colors.textMuted },
                        ]}
                      >
                        {srv.name || `Server ${idx + 1}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Web-Matching Action Buttons Dock */}
            <View style={styles.actionDock}>
              {courseId ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isBookmarked ? 'rgba(204,120,92,0.16)' : colors.bgCardSubtle,
                      borderColor: isBookmarked ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => toggleCourseBookmark(courseId)}
                  activeOpacity={0.8}
                >
                  {isBookmarked ? (
                    <BookmarkCheck size={15} color={colors.accent} />
                  ) : (
                    <Bookmark size={15} color={colors.textMuted} />
                  )}
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: isBookmarked ? colors.accent : colors.text },
                    ]}
                  >
                    {isBookmarked ? 'Bookmarked' : 'Bookmark Batch'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: isSaved ? 'rgba(204,120,92,0.16)' : colors.bgCardSubtle,
                    borderColor: isSaved ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => toggleSaveVideo(lecture, courseId, courseTitle)}
                activeOpacity={0.8}
              >
                {isSaved ? (
                  <FolderHeart size={15} color={colors.accent} />
                ) : (
                  <FolderPlus size={15} color={colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: isSaved ? colors.accent : colors.text },
                  ]}
                >
                  {isSaved ? 'Saved' : 'Save Video'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: isWatched ? `${colors.green}18` : colors.bgCardSubtle,
                    borderColor: isWatched ? colors.green : colors.border,
                  },
                ]}
                onPress={() => toggleLectureWatched(courseId, watchKey)}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={15} color={isWatched ? colors.green : colors.textDim} />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: isWatched ? colors.green : colors.text },
                  ]}
                >
                  {isWatched ? 'Watched' : 'Mark Watched'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                onPress={handleShareLecture}
                activeOpacity={0.8}
              >
                <Share2 size={15} color={colors.textMuted} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Share</Text>
              </TouchableOpacity>

              {/* Individual Video Link: Get File on Filetosed (Telegram Bot) */}
              {lecture.fileStoreUrl ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: 'rgba(56, 189, 248, 0.14)',
                      borderColor: 'rgba(56, 189, 248, 0.42)',
                    },
                  ]}
                  onPress={() => Linking.openURL(lecture.fileStoreUrl!).catch(() => {})}
                  activeOpacity={0.82}
                >
                  <Send size={14} color="#38bdf8" />
                  <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>
                    Get File on Filetosed
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Individual Video Link: File Stream Bot (Website Link) */}
              {lecture.streamBotUrl ? (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: 'rgba(204, 120, 92, 0.15)',
                      borderColor: 'rgba(204, 120, 92, 0.45)',
                    },
                  ]}
                  onPress={() => Linking.openURL(lecture.streamBotUrl!).catch(() => {})}
                  activeOpacity={0.82}
                >
                  <ExternalLink size={14} color={colors.accent} />
                  <Text style={[styles.actionBtnText, { color: colors.accent }]}>
                    File Stream Bot
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Batch Lecture Queue / Playlist */}
          {playlist.length > 0 && (
            <View
              style={[
                styles.playlistCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={[styles.playlistHeader, { borderBottomColor: colors.borderSubtle }]}>
                <ListVideo size={18} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playlistTitle, { color: colors.text }]}>
                    Batch Lecture Queue
                  </Text>
                  <Text style={[styles.playlistSub, { color: colors.textDim }]} numberOfLines={1}>
                    {playlist.length} Lectures • {courseTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.playlistItems}>
                {playlist.map((item, idx) => {
                  const isCurrent = idx === currentIdx;
                  const itemKey =
                    item.url || item.links?.url || item.servers?.[0]?.url || item.id || '';
                  const itemWatched = [
                    itemKey,
                    item.url,
                    item.links?.url,
                    ...(item.servers?.map((s) => s.url) || []),
                    item.id,
                  ].some((k) => Boolean(k && watchedMap[k]));

                  return (
                    <View
                      key={item.id || `pl-${idx}`}
                      style={[
                        isCurrent && {
                          borderRadius: radii.lg,
                          borderWidth: 1.5,
                          borderColor: colors.accent,
                          backgroundColor: 'rgba(204,120,92,0.08)',
                        },
                      ]}
                    >
                      <LectureRow
                        item={item}
                        index={idx}
                        isWatched={itemWatched}
                        variant="list"
                        onPress={() => handleSelectPlaylistLecture(idx)}
                        onToggleWatched={() => toggleLectureWatched(courseId, itemKey)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  courseSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  reloadBtn: {
    padding: 4,
  },
  playerContainer: {
    backgroundColor: '#000000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 12,
  },
  upperLayerWrap: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    zIndex: 30,
  },
  upperCollapsedRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  upperTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 17, 16, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  upperToggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  upperBarExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 17, 16, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  upperCourseText: {
    color: '#f3b59f',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upperTitleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  upperActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upperIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitFsPillWrap: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 35,
  },
  exitFsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 22, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  exitFsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsContainer: {
    flex: 1,
    padding: spacing.base,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.base,
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  metaChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardLectureLabel: {
    fontSize: 16.5,
    fontWeight: '700',
    lineHeight: 22.5,
    marginBottom: 12,
  },
  serverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serverPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  serverPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playlistCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  playlistTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  playlistSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  playlistItems: {
    padding: spacing.sm,
    gap: 8,
  },
  pdfTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pdfBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pdfBadgeText: {
    color: '#d97706',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  pdfHeaderIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfToolbar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  pdfToolbarScroll: {
    paddingHorizontal: spacing.base,
    gap: 8,
    alignItems: 'center',
  },
  pdfEngineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  pdfEngineText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  pdfCanvas: {
    flex: 1,
    position: 'relative',
  },
  pdfWebView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  pdfImageScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    zIndex: 10,
  },
  pdfLoadingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pdfErrorBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    zIndex: 20,
  },
  pdfErrorText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  pdfFallbackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  pdfFallbackBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
