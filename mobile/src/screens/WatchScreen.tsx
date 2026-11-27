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
import { RootStackParamList, ServerOption } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/config';
import { resolveMobileMedia, fetchResolvedStreamUrl } from '../lib/streamResolver';
import { LiquidGlassVideoPlayer } from '../components/LiquidGlassVideoPlayer';
import { spacing, radii } from '../theme/spacing';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react-native';

type WatchRouteProp = RouteProp<RootStackParamList, 'Watch'>;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
  const { watchedMap, toggleLectureWatched } = useAuth();
  const { lecture, courseId, courseTitle } = route.params;

  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isManualFullscreen, setIsManualFullscreen] = useState(false);
  const [apiStreamUrl, setApiStreamUrl] = useState<string | null>(null);
  const [nativeFallbackToWebView, setNativeFallbackToWebView] = useState(false);

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

  const watchKey = mediaConfig.rawUrl || lecture.id || '';
  const isWatched = !!watchedMap[watchKey];

  const finalNativeStreamUrl =
    mediaConfig.mode === 'native-video' && !nativeFallbackToWebView
      ? mediaConfig.needsApiResolution
        ? apiStreamUrl
        : mediaConfig.resolvedUrl
      : null;

  const isNativeVideoActive = Boolean(finalNativeStreamUrl);
  const useIframeWrapper = mediaConfig.mode === 'abyss' || mediaConfig.mode === 'youtube';

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

      {/* Player Container with Liquid Glass Outer Rim */}
      <View
        style={[
          styles.playerContainer,
          playerBoxStyle,
          !isExpandedPlayer && styles.liquidGlassBezel,
        ]}
      >
        {isNativeVideoActive && finalNativeStreamUrl ? (
          <LiquidGlassVideoPlayer
            key={`${finalNativeStreamUrl}-${selectedServerIdx}`}
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
              Preparing Liquid Glass Stream...
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
              key={`${webViewKey}-${selectedServerIdx}`}
              source={
                useIframeWrapper
                  ? { html: iframeWrapperHtml, baseUrl: `${API_BASE_URL}/` }
                  : { uri: mediaConfig.resolvedUrl }
              }
              style={styles.webView}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="compatibility"
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              injectedJavaScript={FULLSCREEN_BRIDGE_JS}
              onMessage={handleWebViewMessage}
              onLoadEnd={() => setLoading(false)}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              allowsInlineMediaPlayback
              setSupportMultipleWindows={false}
            />
          </>
        )}

        {/* Liquid Glass Exit Fullscreen Pill */}
        {isManualFullscreen && (
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

      {/* Details Box (Hidden in Landscape / Fullscreen) */}
      {!isExpandedPlayer && (
        <ScrollView
          style={styles.detailsContainer}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardHeading, { color: colors.accent }]}>Now Playing</Text>
              <View
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: isNativeVideoActive
                      ? 'rgba(204, 120, 92, 0.14)'
                      : colors.bgCardSubtle,
                    borderColor: isNativeVideoActive ? 'rgba(204, 120, 92, 0.32)' : colors.borderSubtle,
                  },
                ]}
              >
                <Sparkles
                  size={11}
                  color={isNativeVideoActive ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeChipText,
                    { color: isNativeVideoActive ? colors.accent : colors.textMuted },
                  ]}
                >
                  {isNativeVideoActive
                    ? 'Liquid Glass Player • Tap 2x to Skip 10s'
                    : mediaConfig.mode === 'abyss'
                    ? 'Abyss Embed Player'
                    : 'Stream Player'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardLectureLabel, { color: colors.text }]}>{lecture.label}</Text>
            {lecture.subject ? (
              <Text style={[styles.cardSubject, { color: colors.textMuted }]}>
                Subject: {lecture.subject}
              </Text>
            ) : null}

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

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.badgePillText, { color: colors.textMuted }]}>
                  Ad-Free Stream
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.badgePill,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: isWatched ? `${colors.green}18` : colors.bgCardSubtle,
                    borderColor: isWatched ? colors.green : colors.borderSubtle,
                  },
                ]}
                onPress={() => toggleLectureWatched(courseId, watchKey)}
              >
                <CheckCircle2
                  size={13}
                  color={isWatched ? colors.green : colors.textDim}
                />
                <Text
                  style={[
                    styles.badgePillText,
                    { color: isWatched ? colors.green : colors.textMuted },
                  ]}
                >
                  {isWatched ? 'Completed' : 'Mark Watched'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  liquidGlassBezel: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.16)',
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
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  modeChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardLectureLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  cardSubject: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  serverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
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
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
