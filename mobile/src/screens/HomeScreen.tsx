import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { Header } from '../components/Header';
import { BrandSpike } from '../components/BrandSpike';
import { getCourseById } from '../data/coursesData';
import { spacing, radii } from '../theme/spacing';
import {
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Flame,
  Play,
  Compass,
  Landmark,
  Cpu,
  ArrowRight,
  Send,
  MessageSquare,
  ExternalLink,
} from 'lucide-react-native';

function getTimeGreetingData(firstName: string) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      timeSlot: 'morning',
      greeting: `Good Morning, ${firstName}`,
      subtext: 'Fresh day, new targets — start a focused session today.',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      timeSlot: 'afternoon',
      greeting: `Good Afternoon, ${firstName}`,
      subtext: 'Keep up your afternoon momentum — pick up where you left off.',
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      timeSlot: 'evening',
      greeting: `Good Evening, ${firstName}`,
      subtext: 'Evening revision & deep practice time — finish strong today.',
    };
  }
  return {
    timeSlot: 'night',
    greeting: `Happy Late Study, ${firstName}`,
    subtext: 'Quiet hours for deep concentration — every topic counts.',
  };
}

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { user, lastPlayed } = useAuth();
  const { openPrivacyModal } = useDrawer();

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const exploreYRef = useRef<number>(0);

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Student';
  const firstName = userName.split(' ')[0];
  const initials = getInitials(userName);
  const greetingData = useMemo(() => getTimeGreetingData(firstName), [firstName]);

  const lastPlayedCourse = useMemo(() => {
    if (!lastPlayed?.courseId) return null;
    return getCourseById(lastPlayed.courseId) || null;
  }, [lastPlayed]);

  const scrollToExplore = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, exploreYRef.current - 12),
      animated: true,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO SECTION (Exact Mobile Replica of #hero in src/app/page.tsx) */}
        <View style={styles.heroSection}>
          {/* Trust & Credibility Badge */}
          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
            ]}
          >
            <ShieldCheck size={14} color={colors.green} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              Trusted by Students Across India
            </Text>
            <Text style={{ color: colors.border }}>•</Text>
            <Text style={[styles.trustAccent, { color: colors.accent }]}>
              100% Free &amp; Open
            </Text>
          </View>

          {/* Hero Eyebrow */}
          <View style={styles.eyebrowPill}>
            <View style={[styles.eyebrowDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.eyebrowText, { color: colors.accent }]}>
              YOUR COMPLETE STUDY COMPANION
            </Text>
          </View>

          {/* Hero Title */}
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Study Smart.{'\n'}Score <Text style={{ color: colors.accent }}>Higher.</Text>
          </Text>

          {/* Hero Lead */}
          <Text style={[styles.heroLead, { color: colors.textMuted }]}>
            All your SSC, Competitive Exams &amp; GATE Engineering lectures, notes and resources —
            organized in one clean, ad-free portal.
          </Text>

          {/* Hero Action Buttons (Stacked full-width on mobile matching CSS) */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.accent }]}
              onPress={scrollToExplore}
              activeOpacity={0.85}
            >
              <BookOpen size={16} color="#ffffff" />
              <Text style={styles.btnPrimaryText}>Explore Courses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnGhost,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('Help')}
              activeOpacity={0.8}
            >
              <HelpCircle size={16} color={colors.text} />
              <Text style={[styles.btnGhostText, { color: colors.text }]}>
                Help &amp; Community
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. PERSONALIZED TIME-BASED GREETING BANNER */}
        {user && (
          <View style={styles.sectionPad}>
            <View
              style={[
                styles.greetingCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.greetingTop}>
                <View
                  style={[
                    styles.greetingAvatar,
                    {
                      backgroundColor: user.avatar_url ? 'transparent' : colors.accent,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {user.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={styles.greetingAvatarImg}
                    />
                  ) : (
                    <Text style={styles.greetingAvatarInitials}>{initials}</Text>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.greetingTitleRow}>
                    <View
                      style={[
                        styles.timeIconBox,
                        { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                      ]}
                    >
                      {greetingData.timeSlot === 'morning' && (
                        <Sunrise size={14} color="#f59e0b" />
                      )}
                      {greetingData.timeSlot === 'afternoon' && (
                        <Sun size={14} color="#eab308" />
                      )}
                      {greetingData.timeSlot === 'evening' && (
                        <Sunset size={14} color="#f97316" />
                      )}
                      {greetingData.timeSlot === 'night' && (
                        <Moon size={14} color="#818cf8" />
                      )}
                    </View>
                    <Text style={[styles.greetingHeading, { color: colors.text }]} numberOfLines={2}>
                      {greetingData.greeting}
                    </Text>
                    <BrandSpike size={17} color={colors.accent} />
                  </View>
                  <Text style={[styles.greetingSubtext, { color: colors.textMuted }]}>
                    {greetingData.subtext}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.viewProgressBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                onPress={() => (navigation as any).navigate('MainTabs', { screen: 'ProfileTab' })}
                activeOpacity={0.75}
              >
                <Text style={[styles.viewProgressText, { color: colors.accent }]}>
                  View Progress
                </Text>
                <ArrowRight size={14} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. CONTINUE LEARNING SECTION */}
        <View style={styles.sectionPad}>
          <View style={styles.continueHeader}>
            <Flame size={20} color={colors.accent} />
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Continue Learning
            </Text>
          </View>

          {lastPlayed && lastPlayedCourse ? (
            <TouchableOpacity
              style={[
                styles.continueActiveCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() =>
                navigation.navigate('CourseDetail', {
                  courseId: lastPlayedCourse.id,
                  title: lastPlayedCourse.name,
                })
              }
              activeOpacity={0.82}
            >
              <View style={[styles.playCircleSmall, { backgroundColor: colors.accent }]}>
                <Play size={16} color="#ffffff" fill="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.continueEyebrow, { color: colors.accent }]}>
                  RESUME LECTURE
                </Text>
                <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                  {lastPlayed.lectureTitle || lastPlayedCourse.name}
                </Text>
                <Text style={[styles.continueSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {lastPlayedCourse.name}
                </Text>
              </View>
              <ArrowRight size={18} color={colors.accent} />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.continueEmptyCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.emptyPlayCircle}>
                <Play size={22} color={colors.accent} />
              </View>
              <Text style={[styles.emptyCardTitle, { color: colors.text }]}>
                Ready to Start Learning?
              </Text>
              <Text style={[styles.emptyCardBody, { color: colors.textMuted }]}>
                Select any Government Exam or GATE Engineering track below to track your lectures
                automatically.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCtaBtn, { backgroundColor: colors.accent }]}
                onPress={scrollToExplore}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyCtaText}>Explore Course Portals</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. EXPLORE COURSE SECTIONS (CURATED LEARNING TRACKS) */}
        <View
          style={styles.sectionPad}
          onLayout={(e) => {
            exploreYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.tracksHeader}>
            <View style={styles.tracksEyebrow}>
              <Compass size={13} color={colors.accent} />
              <Text style={[styles.tracksEyebrowText, { color: colors.accent }]}>
                EXPLORE COURSE SECTIONS
              </Text>
            </View>
            <Text style={[styles.tracksTitle, { color: colors.text }]}>
              Curated Learning Tracks
            </Text>
            <Text style={[styles.tracksSub, { color: colors.textMuted }]}>
              Select a specialized portal for government exams or GATE engineering courses.
            </Text>
          </View>

          {/* Portal Card 1: Government Exam Section */}
          <TouchableOpacity
            style={[
              styles.portalCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('GovtExams')}
            activeOpacity={0.85}
          >
            <View style={styles.portalTop}>
              <View style={[styles.portalIconBox, { backgroundColor: colors.govtDim }]}>
                <Landmark size={24} color={colors.govtIndigo} />
              </View>
              <View style={[styles.portalBadge, { backgroundColor: colors.govtDim }]}>
                <Text style={[styles.portalBadgeText, { color: colors.govtIndigo }]}>
                  9 Batches • 1,400+ Classes
                </Text>
              </View>
            </View>

            <Text style={[styles.portalTitle, { color: colors.text }]}>
              Government Exam Section
            </Text>
            <Text style={[styles.portalDesc, { color: colors.textMuted }]}>
              All SSC, CGL, CHSL, MTS, Railway &amp; Banking foundation batches organized by
              discipline.
            </Text>

            <View style={styles.portalFooter}>
              <View style={styles.portalTags}>
                {['SSC CGL/CHSL', 'General Studies', 'Aptitude'].map((t) => (
                  <View
                    key={t}
                    style={[
                      styles.portalTagChip,
                      { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.portalTagText, { color: colors.textDim }]}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.portalExplore}>
                <Text style={[styles.portalExploreText, { color: colors.govtIndigo }]}>
                  Explore
                </Text>
                <ArrowRight size={15} color={colors.govtIndigo} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Portal Card 2: GATE Engineering Section */}
          <TouchableOpacity
            style={[
              styles.portalCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('Gate')}
            activeOpacity={0.85}
          >
            <View style={styles.portalTop}>
              <View style={[styles.portalIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Cpu size={24} color="#f59e0b" />
              </View>
              <View style={[styles.portalBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Text style={[styles.portalBadgeText, { color: '#d97706' }]}>
                  ECE • 36 Lectures
                </Text>
              </View>
            </View>

            <Text style={[styles.portalTitle, { color: colors.text }]}>
              GATE Engineering Section
            </Text>
            <Text style={[styles.portalDesc, { color: colors.textMuted }]}>
              Structured GATE ECE preparation featuring Made Easy Signals &amp; Systems full video
              series, Fourier, Laplace &amp; Z-Transform.
            </Text>

            <View style={styles.portalFooter}>
              <View style={styles.portalTags}>
                {['GATE ECE', 'Made Easy', 'Signals'].map((t) => (
                  <View
                    key={t}
                    style={[
                      styles.portalTagChip,
                      { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.portalTagText, { color: colors.textDim }]}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.portalExplore}>
                <Text style={[styles.portalExploreText, { color: '#d97706' }]}>Explore</Text>
                <ArrowRight size={15} color="#d97706" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. HELP & COMMUNITY BOX */}
        <View style={styles.sectionPad}>
          <View
            style={[
              styles.helpBoxCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.helpIconCircle}>
              <HelpCircle size={26} color={colors.accent} />
            </View>
            <Text style={[styles.helpBoxTitle, { color: colors.text }]}>
              Need Help or Have Questions?
            </Text>
            <Text style={[styles.helpBoxDesc, { color: colors.textMuted }]}>
              Get direct support for lecture queries, study material issues, or course updates via
              our official community channels.
            </Text>

            <View style={styles.helpBtnGroup}>
              <TouchableOpacity
                style={[styles.helpPillBtn, { backgroundColor: '#229ED9' }]}
                onPress={() => Linking.openURL('https://t.me/stutosed')}
                activeOpacity={0.85}
              >
                <Send size={14} color="#ffffff" />
                <Text style={styles.helpPillText}>Telegram Channel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpPillBtn, { backgroundColor: colors.accent }]}
                onPress={() => Linking.openURL('https://t.me/chatstubot')}
                activeOpacity={0.85}
              >
                <MessageSquare size={14} color="#ffffff" />
                <Text style={styles.helpPillText}>Contact Developer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpPillBtn, { backgroundColor: '#5865F2' }]}
                onPress={() =>
                  Alert.alert(
                    'Discord Community',
                    'Discord server invite will be added soon! Join our Telegram channel in the meantime.'
                  )
                }
                activeOpacity={0.85}
              >
                <ExternalLink size={14} color="#ffffff" />
                <Text style={styles.helpPillText}>Discord Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. UPGRADED MULTI-COLUMN FOOTER */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.bgCard, borderTopColor: colors.border },
          ]}
        >
          {/* Col 1: Brand */}
          <View style={styles.footerBlock}>
            <View style={styles.footerBrandRow}>
              <BrandSpike size={22} color={colors.accent} />
              <Text style={[styles.footerBrandText, { color: colors.text }]}>stutosed</Text>
            </View>
            <Text style={[styles.footerTagline, { color: colors.textMuted }]}>
              Free, ad-free study portal providing structured lectures, curated video series, and
              verified PDF notes for competitive exams &amp; GATE preparation.
            </Text>
            <View style={styles.footerBadgeRow}>
              <ShieldCheck size={14} color={colors.green} />
              <Text style={[styles.footerBadgeText, { color: colors.textDim }]}>
                Non-Commercial Student Platform
              </Text>
            </View>
          </View>

          {/* Col 2: Learning Tracks */}
          <View style={styles.footerBlock}>
            <Text style={[styles.footerColHeading, { color: colors.text }]}>
              LEARNING TRACKS
            </Text>
            <TouchableOpacity
              style={styles.footerLinkBtn}
              onPress={() => navigation.navigate('GovtExams')}
            >
              <Landmark size={14} color={colors.govtIndigo} />
              <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>
                Government Exams (SSC CGL/CHSL)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerLinkBtn}
              onPress={() => navigation.navigate('Gate')}
            >
              <Cpu size={14} color="#f59e0b" />
              <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>
                GATE Engineering (ECE Made Easy)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerLinkBtn}
              onPress={() => navigation.navigate('Help')}
            >
              <HelpCircle size={14} color={colors.textMuted} />
              <Text style={[styles.footerLinkText, { color: colors.textMuted }]}>
                Help Center &amp; FAQs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Col 3: Community & Connect */}
          <View style={[styles.footerBlock, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 24 }]}>
            <Text style={[styles.footerColHeading, { color: colors.text }]}>
              COMMUNITY &amp; CONNECT
            </Text>
            <TouchableOpacity
              style={[
                styles.footerSocialCard,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={() => Linking.openURL('https://t.me/stutosed')}
              activeOpacity={0.8}
            >
              <View style={styles.footerSocialLeft}>
                <Send size={14} color="#229ED9" />
                <Text style={[styles.footerSocialText, { color: colors.text }]}>
                  Telegram Channel
                </Text>
              </View>
              <ExternalLink size={13} color={colors.textDim} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerSocialCard,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
              onPress={() => Linking.openURL('https://t.me/chatstubot')}
              activeOpacity={0.8}
            >
              <View style={styles.footerSocialLeft}>
                <MessageSquare size={14} color={colors.accent} />
                <Text style={[styles.footerSocialText, { color: colors.text }]}>
                  Contact Developer
                </Text>
              </View>
              <ExternalLink size={13} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          {/* Bottom Credits */}
          <View style={styles.footerBottom}>
            <Text style={[styles.copyrightText, { color: colors.textDim }]}>
              © {new Date().getFullYear()} stutosed. Designed for students. All course content
              belongs to respective educators.
            </Text>
            <View style={styles.creditLinksRow}>
              <TouchableOpacity onPress={() => openPrivacyModal('privacy')}>
                <Text style={[styles.creditLink, { color: colors.textDim }]}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.border }}>•</Text>
              <TouchableOpacity onPress={() => openPrivacyModal('terms')}>
                <Text style={[styles.creditLink, { color: colors.textDim }]}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={{ color: colors.border }}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Help')}>
                <Text style={[styles.creditLink, { color: colors.textDim }]}>
                  Support &amp; Help Center
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 34,
    alignItems: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginBottom: 16,
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  trustAccent: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(204,120,92,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204,120,92,0.22)',
    marginBottom: 20,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 41,
    letterSpacing: -1.1,
  },
  heroLead: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 360,
  },
  heroActions: {
    width: '100%',
    gap: 9,
    marginTop: 26,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    shadowColor: '#cc785c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12.5,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionPad: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  greetingCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  greetingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  greetingAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  greetingAvatarImg: {
    width: '100%',
    height: '100%',
  },
  greetingAvatarInitials: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  timeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingHeading: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  greetingSubtext: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  viewProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  viewProgressText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '700',
  },
  continueActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  playCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  continueTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  continueSub: {
    fontSize: 12,
  },
  continueEmptyCard: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(204,120,92,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyCardBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyCtaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  emptyCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tracksHeader: {
    marginBottom: 18,
  },
  tracksEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tracksEyebrowText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  tracksTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  tracksSub: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  portalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  portalTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  portalIconBox: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  portalBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  portalDesc: {
    fontSize: 13,
    lineHeight: 19.5,
    marginBottom: 16,
  },
  portalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  portalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  portalTagChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  portalTagText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  portalExplore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  portalExploreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  futureTracksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  futureLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  futureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  futureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  futureChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  helpBoxCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  helpIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(204,120,92,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  helpBoxTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpBoxDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19.5,
    marginBottom: 18,
  },
  helpBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  helpPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  helpPillText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 24,
    marginTop: 12,
    gap: 24,
  },
  footerBlock: {
    gap: 10,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBrandText: {
    fontSize: 20,
    fontWeight: '700',
  },
  footerTagline: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  footerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  footerBadgeText: {
    fontSize: 12,
  },
  footerColHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  footerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerSocialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  footerSocialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerSocialText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerBottom: {
    gap: 10,
  },
  copyrightText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  creditLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  creditLink: {
    fontSize: 12,
    fontWeight: '500',
  },
});
