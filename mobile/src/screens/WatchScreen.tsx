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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import * as ScreenOrientation from 'expo-screen-orientation';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/config';
import { spacing, radii } from '../theme/spacing';
import { ArrowLeft, RefreshCw, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react-native';

type WatchRouteProp = RouteProp<RootStackParamList, 'Watch'>;

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

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

  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isManualFullscreen, setIsManualFullscreen] = useState(false);

  const isLandscape = width > height;
  const isExpandedPlayer = isLandscape || isManualFullscreen;

  // Unlock orientation while watching a lecture, restore portrait cleanly on exit
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

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

  const playerConfig = useMemo(() => {
    const rawUrl = (
      lecture.links?.url ||
      lecture.servers?.[0]?.url ||
      lecture.url ||
      ''
    ).trim();

    const lowerUrl = rawUrl.toLowerCase();
    const firstServerType = (lecture.servers?.[0]?.type || '').toLowerCase();
    const isAbyss =
      lowerUrl.includes('abyssplayer.com') ||
      lowerUrl.includes('abyss.to') ||
      lecture.type === 'abyss' ||
      firstServerType === 'abyss';

    if (isAbyss) {
      let resolved = rawUrl;
      if (!lowerUrl.includes('player.abyssplayer.com')) {
        const match = rawUrl.match(/(?:abyss\.to\/|abyssplayer\.com\/|files\/)([a-zA-Z0-9_-]{8,15})/);
        const fileId = match ? match[1] : lecture.id || '';
        if (fileId) {
          resolved = `https://player.abyssplayer.com/${fileId}`;
        }
      }
      return {
        rawUrl,
        resolvedUrl: resolved,
        useIframeWrapper: true,
      };
    }

    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      return {
        rawUrl,
        resolvedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
        useIframeWrapper: true,
      };
    }

    const isPdf = lecture.type === 'pdf' || lowerUrl.endsWith('.pdf');
    if (isPdf && rawUrl) {
      return {
        rawUrl,
        resolvedUrl: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(rawUrl)}`,
        useIframeWrapper: false,
      };
    }

    return {
      rawUrl,
      resolvedUrl: rawUrl,
      useIframeWrapper: false,
    };
  }, [lecture]);

  const watchKey = playerConfig.rawUrl || lecture.id || '';
  const isWatched = !!watchedMap[watchKey];

  const iframeWrapperHtml = useMemo(() => {
    const safeSrc = escapeHtmlAttr(playerConfig.resolvedUrl);
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
  }, [playerConfig.resolvedUrl]);

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

    if (playerConfig.useIframeWrapper) {
      if (reqUrl === 'about:blank' || reqUrl.startsWith(API_BASE_URL.toLowerCase())) {
        return true;
      }
      // Keep the wrapper page as the top frame so Abyss cannot redirect to its home website
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
        </View>
      )}

      {/* Player Container */}
      <View style={[styles.playerContainer, playerBoxStyle]}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Connecting to High-Speed Stream...
            </Text>
          </View>
        )}

        <WebView
          key={webViewKey}
          source={
            playerConfig.useIframeWrapper
              ? { html: iframeWrapperHtml, baseUrl: `${API_BASE_URL}/` }
              : { uri: playerConfig.resolvedUrl }
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

        {/* Subtle Exit Fullscreen Button when user rotated manually */}
        {isManualFullscreen && (
          <TouchableOpacity
            style={styles.exitFsPill}
            onPress={exitLandscapeFullscreen}
            activeOpacity={0.8}
          >
            <Minimize2 size={15} color="#ffffff" />
            <Text style={styles.exitFsText}>Exit Fullscreen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Details Box (Hidden in Landscape / Fullscreen) */}
      {!isExpandedPlayer && (
        <View style={styles.detailsContainer}>
          <View
            style={[
              styles.detailCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeading, { color: colors.accent }]}>Now Playing</Text>
            <Text style={[styles.cardLectureLabel, { color: colors.text }]}>{lecture.label}</Text>
            {lecture.subject ? (
              <Text style={[styles.cardSubject, { color: colors.textMuted }]}>
                Subject: {lecture.subject}
              </Text>
            ) : null}

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
        </View>
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
  exitFsPill: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18, 17, 16, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exitFsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  cardHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
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
