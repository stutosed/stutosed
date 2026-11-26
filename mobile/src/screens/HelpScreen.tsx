import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { spacing, radii } from '../theme/spacing';
import {
  ArrowLeft,
  HelpCircle,
  Send,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Scale,
} from 'lucide-react-native';

export const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { openPrivacyModal } = useDrawer();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.bgCard, borderBottomColor: colors.borderSubtle },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <HelpCircle size={18} color={colors.accent} />
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          Help &amp; Community Support
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Frequently Asked Questions */}
        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>

          <View style={styles.faqList}>
            <View>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                1. Is everything on this website really 100% free?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                Yes! All lectures, PDF notes, and resources are curated and accessible completely
                free with no subscriptions or paywalls.
              </Text>
            </View>

            <View>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                2. Why is student login required?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                Creating a student account syncs your watched lecture history, progress
                percentage, and last-played lectures across all your devices securely.
              </Text>
            </View>

            <View>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                3. How do I report a broken video link or missing notes?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                You can directly report any broken link to the developer via Telegram @chatstubot
                or post in our official discussion channel for quick resolution.
              </Text>
            </View>
          </View>
        </View>

        {/* Direct Community Channels */}
        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Connect Directly with Community
          </Text>

          <View style={styles.channelsList}>
            <TouchableOpacity
              style={[styles.channelBtn, { backgroundColor: '#229ED9' }]}
              onPress={() => Linking.openURL('https://t.me/stutosed')}
              activeOpacity={0.85}
            >
              <View style={styles.channelLeft}>
                <Send size={16} color="#ffffff" />
                <Text style={styles.channelText}>Official Telegram Channel (@stutosed)</Text>
              </View>
              <ArrowRight size={15} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelBtn, { backgroundColor: colors.accent }]}
              onPress={() => Linking.openURL('https://t.me/chatstubot')}
              activeOpacity={0.85}
            >
              <View style={styles.channelLeft}>
                <MessageSquare size={16} color="#ffffff" />
                <Text style={styles.channelText}>Contact Developer (@chatstubot)</Text>
              </View>
              <ArrowRight size={15} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.channelBtn, { backgroundColor: '#5865F2' }]}
              onPress={() =>
                Alert.alert(
                  'Discord Community',
                  'Discord server link will be updated shortly! Please connect via our Telegram channel.'
                )
              }
              activeOpacity={0.85}
            >
              <View style={styles.channelLeft}>
                <ExternalLink size={16} color="#ffffff" />
                <Text style={styles.channelText}>Discord Community</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal & Privacy Center */}
        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <View style={styles.legalHeader}>
            <ShieldCheck size={17} color={colors.green} />
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Privacy, Transparency &amp; Terms
            </Text>
          </View>
          <Text style={[styles.faqAnswer, { color: colors.textMuted, marginTop: 8, marginBottom: 14 }]}>
            stutosed is built on strict student-first principles. We do not sell personal data, we
            do not host ads, and we respect educational fair use guidelines.
          </Text>

          <View style={styles.legalBtnsRow}>
            <TouchableOpacity
              style={[
                styles.outlineBtn,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={() => openPrivacyModal('privacy')}
              activeOpacity={0.75}
            >
              <ShieldCheck size={13} color={colors.text} />
              <Text style={[styles.outlineBtnText, { color: colors.text }]}>
                Read Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outlineBtn,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={() => openPrivacyModal('terms')}
              activeOpacity={0.75}
            >
              <Scale size={13} color={colors.text} />
              <Text style={[styles.outlineBtnText, { color: colors.text }]}>
                Terms &amp; Conditions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    gap: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 2,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  container: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  helpCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  faqList: {
    gap: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  channelsList: {
    gap: 10,
  },
  channelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radii.md,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  channelText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  soonBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  soonBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legalBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
