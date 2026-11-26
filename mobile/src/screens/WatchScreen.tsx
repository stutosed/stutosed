import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react-native';

type WatchRouteProp = RouteProp<RootStackParamList, 'Watch'>;

export const WatchScreen: React.FC = () => {
  const route = useRoute<WatchRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { watchedMap, toggleLectureWatched } = useAuth();
  const { lecture, courseId, courseTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  const getEmbedUrl = (): string => {
    let rawUrl = lecture.url || '';
    if (lecture.links && lecture.links.url) {
      rawUrl = lecture.links.url;
    }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl();
  const isWatched = !!watchedMap[embedUrl || lecture.id || ''];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top Header */}
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
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Connecting to High-Speed Stream...
            </Text>
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
              onPress={() => toggleLectureWatched(courseId, embedUrl || lecture.id || '')}
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
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const playerHeight = (width * 9) / 16;

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
