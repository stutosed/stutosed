import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import Constants from 'expo-constants';
import { Download, Sparkles, X } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../lib/config';
import { radii, spacing } from '../theme/spacing';

interface AppVersionPayload {
  latestVersion: string;
  minVersion: string;
  downloadUrl: string;
  releasePageUrl?: string;
  releaseNotes?: string;
}

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export const AppUpdateModal: React.FC = () => {
  const { colors } = useTheme();
  const [updateInfo, setUpdateInfo] = useState<AppVersionPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [isForced, setIsForced] = useState(false);
  const [cardWidth, setCardWidth] = useState(340);

  const flowAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let active = true;
    const installedVersion = Constants.expoConfig?.version || '1.0.1';

    fetch(`${API_BASE_URL}/api/v1/app-version?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json) return;
        const payload = (json?.data || json) as AppVersionPayload;
        if (!payload?.latestVersion) return;

        const hasNewer = compareSemver(payload.latestVersion, installedVersion) > 0;
        const belowMin =
          Boolean(payload.minVersion) &&
          compareSemver(installedVersion, payload.minVersion) < 0;

        if (hasNewer || belowMin) {
          setUpdateInfo(payload);
          setIsForced(belowMin);
          setVisible(true);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const flowLoop = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.55, duration: 1100, useNativeDriver: true }),
      ])
    );
    flowLoop.start();
    glowLoop.start();
    return () => {
      flowLoop.stop();
      glowLoop.stop();
    };
  }, [visible, flowAnim, glowAnim]);

  if (!visible || !updateInfo) return null;

  const installedVersion = Constants.expoConfig?.version || '1.0.1';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isForced) setVisible(false);
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onLayout={(e) => setCardWidth(Math.max(240, Math.round(e.nativeEvent.layout.width)))}
        >
          {/* Glowing Blue + Claude Orange Flowing Top Bar */}
          <View style={styles.topBarTrack}>
            <Animated.View
              style={[
                styles.topBarStrip,
                {
                  width: cardWidth * 2,
                  opacity: glowAnim,
                  transform: [
                    {
                      translateX: flowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-cardWidth, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Svg width={cardWidth * 2} height={4}>
                <Defs>
                  <LinearGradient id="updBar" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#2563eb" />
                    <Stop offset="0.33" stopColor="#cc785c" />
                    <Stop offset="0.66" stopColor="#38bdf8" />
                    <Stop offset="1" stopColor="#2563eb" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width={cardWidth * 2} height={4} fill="url(#updBar)" />
              </Svg>
            </Animated.View>
          </View>

          <View style={styles.body}>
            <View style={styles.headerRow}>
              <View style={styles.badge}>
                <Sparkles size={13} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  NEW APP UPDATE AVAILABLE
                </Text>
              </View>
              {!isForced && (
                <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              stutosed v{updateInfo.latestVersion} Ready
            </Text>
            <Text style={[styles.sub, { color: colors.textDim }]}>
              Installed: v{installedVersion} → Latest: v{updateInfo.latestVersion}
            </Text>

            <View
              style={[
                styles.notesBox,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[styles.notesText, { color: colors.textMuted }]} numberOfLines={6}>
                {updateInfo.releaseNotes ||
                  'New improvements, bug fixes, and faster streaming experience are ready to install.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
              onPress={() => {
                const target = updateInfo.downloadUrl || updateInfo.releasePageUrl;
                if (target) Linking.openURL(target).catch(() => {});
              }}
            >
              <Download size={16} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Download Update (APK)</Text>
            </TouchableOpacity>

            {!isForced && (
              <TouchableOpacity
                style={[styles.laterBtn, { borderColor: colors.border }]}
                onPress={() => setVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.laterBtnText, { color: colors.textMuted }]}>Remind Me Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topBarTrack: {
    width: '100%',
    height: 4,
    overflow: 'hidden',
  },
  topBarStrip: {
    height: 4,
  },
  body: {
    padding: spacing.lg,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(204, 120, 92, 0.14)',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginVertical: 2,
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radii.md,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  laterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  laterBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
