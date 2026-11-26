import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../theme/spacing';
import { X, ShieldCheck, Scale, CheckCircle2, Lock } from 'lucide-react-native';

interface PrivacyTermsModalProps {
  visible: boolean;
  initialTab?: 'privacy' | 'terms';
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  visible,
  initialTab = 'privacy',
  onClose,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Gradient-like Accent Bar */}
          <View style={[styles.topAccentBar, { backgroundColor: colors.accent }]} />

          {/* Header with Tabs */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.tabGroup}>
              <TouchableOpacity
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      activeTab === 'privacy' ? 'rgba(204,120,92,0.12)' : colors.bg,
                    borderColor: activeTab === 'privacy' ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setActiveTab('privacy')}
                activeOpacity={0.75}
              >
                <ShieldCheck
                  size={14}
                  color={activeTab === 'privacy' ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'privacy' ? colors.accent : colors.textMuted },
                  ]}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      activeTab === 'terms' ? 'rgba(204,120,92,0.12)' : colors.bg,
                    borderColor: activeTab === 'terms' ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setActiveTab('terms')}
                activeOpacity={0.75}
              >
                <Scale
                  size={14}
                  color={activeTab === 'terms' ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'terms' ? colors.accent : colors.textMuted },
                  ]}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
              ]}
            >
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'privacy' ? (
              <View style={styles.sectionStack}>
                <View style={styles.titleRow}>
                  <Lock size={18} color={colors.green} />
                  <Text style={[styles.heading, { color: colors.text }]}>
                    Student Privacy First
                  </Text>
                </View>
                <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                  stutosed is a non-commercial educational portal designed strictly for students.
                  We do not serve behavioral ads, sell your email address, or share your viewing
                  activity with third-party data brokers.
                </Text>

                <View
                  style={[
                    styles.bulletCard,
                    { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.green} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Account Data: </Text>
                      Only your name, email, and avatar are stored via Better Auth for cloud
                      sync across devices.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.green} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Study Progress: </Text>
                      Watched lectures and bookmarks are securely synced with our Turso database
                      under your account ID.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.green} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Guest Mode: </Text>
                      You can browse and study locally without signing in; progress stays in your
                      device storage.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.sectionStack}>
                <View style={styles.titleRow}>
                  <Scale size={18} color={colors.accent} />
                  <Text style={[styles.heading, { color: colors.text }]}>
                    Terms & Educational Fair Use
                  </Text>
                </View>
                <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                  All curated lectures, PDF notes, and topic playlists indexed in stutosed remain
                  the intellectual property of their respective educators and institutions.
                </Text>

                <View
                  style={[
                    styles.bulletCard,
                    { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.accent} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Non-Commercial Access: </Text>
                      All courses and portals are 100% free with zero paywalls or subscriptions.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.accent} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Personal Study Only: </Text>
                      Content is organized strictly for personal academic preparation (SSC,
                      Banking, BEU B.Tech, and GATE).
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <CheckCircle2 size={15} color={colors.accent} />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      <Text style={{ fontWeight: '700' }}>Support & Takedowns: </Text>
                      Contact @chatstubot on Telegram for broken links or content concerns.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 17, 16, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topAccentBar: {
    height: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  sectionStack: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  bulletCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
