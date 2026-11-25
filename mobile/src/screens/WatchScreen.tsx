import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react-native';

type WatchRouteProp = RouteProp<RootStackParamList, 'Watch'>;

export const WatchScreen: React.FC = () => {
  const route = useRoute<WatchRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lecture, courseTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  // Normalize media stream / embed URL
  const getEmbedUrl = (): string => {
    let rawUrl = lecture.url || '';
    if (lecture.links && lecture.links.url) {
      rawUrl = lecture.links.url;
    }

    if (rawUrl.includes('abyssplayer.com') || rawUrl.includes('vidmoly.to')) {
      return rawUrl;
    }

    // Direct link or web embed fallback
    return rawUrl;
  };

  const embedUrl = getEmbedUrl();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.lectureTitle} numberOfLines={1}>
            {lecture.label}
          </Text>
          <Text style={styles.courseSubtitle} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => setWebViewKey((k) => k + 1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RefreshCw size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Player Container */}
      <View style={styles.playerContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Connecting to High-Speed Stream...</Text>
          </View>
        )}

        <WebView
          key={webViewKey}
          source={{ uri: embedUrl }}
          style={styles.webView}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          onLoadEnd={() => setLoading(false)}
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
        />
      </View>

      {/* Details Box */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailCard}>
          <Text style={styles.cardHeading}>Now Playing</Text>
          <Text style={styles.cardLectureLabel}>{lecture.label}</Text>
          {lecture.subject ? (
            <Text style={styles.cardSubject}>Subject: {lecture.subject}</Text>
          ) : null}

          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Ad-Free Stream</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Hardware Accelerated</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const playerHeight = (width * 9) / 16;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    color: colors.text,
  },
  courseSubtitle: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  reloadBtn: {
    padding: 4,
  },
  playerContainer: {
    width: '100%',
    height: playerHeight,
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
    color: colors.textMuted,
  },
  detailsContainer: {
    flex: 1,
    padding: spacing.base,
  },
  detailCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardLectureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardSubject: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgePill: {
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
