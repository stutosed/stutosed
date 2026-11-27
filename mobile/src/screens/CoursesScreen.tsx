import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { FadeInView } from '../components/FadeInView';
import { spacing, radii } from '../theme/spacing';
import { Layers, Landmark, Cpu, ArrowLeft, ArrowRight } from 'lucide-react-native';

export const CoursesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            style={styles.backLinkBtn}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <ArrowLeft size={14} color={colors.accent} />
            <Text style={[styles.backLinkText, { color: colors.accent }]}>Home</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textDim }}>/</Text>
          <Text style={[styles.breadcrumbCurrent, { color: colors.textMuted }]}>Courses</Text>
        </View>

        {/* Title Block */}
        <FadeInView delay={0}>
          <View style={styles.headerBlock}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(204,120,92,0.12)' }]}>
              <Layers size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Explore All Courses</Text>
              <Text style={[styles.pageSub, { color: colors.textMuted }]}>
                Choose Government Exam batches or GATE Engineering preparation tracks below.
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Portal 1: Government Exam Section */}
        <FadeInView delay={65}>
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
              All SSC, CGL, CHSL, MTS, Railway &amp; Banking foundation batches organized into Maths,
              Reasoning, English, GK/GS &amp; Computer folders.
            </Text>

            <View style={styles.portalFooter}>
              <View style={styles.portalTags}>
                {['SSC CGL/CHSL', 'Banking', 'GK/GS'].map((t) => (
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
                  Open Portal
                </Text>
                <ArrowRight size={15} color={colors.govtIndigo} />
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Portal 2: GATE Engineering Section */}
        <FadeInView delay={130}>
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
              GATE Section
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
                <Text style={[styles.portalExploreText, { color: '#d97706' }]}>Open Portal</Text>
                <ArrowRight size={15} color="#d97706" />
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 18.5,
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
    fontSize: 18.5,
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
});
