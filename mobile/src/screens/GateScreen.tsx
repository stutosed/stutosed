import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, LectureItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { Header } from '../components/Header';
import { loadCourseDetails } from '../data/coursesData';
import { LectureRow } from '../components/LectureRow';
import { spacing, radii } from '../theme/spacing';
import {
  Cpu,
  GraduationCap,
  Folder,
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Video,
} from 'lucide-react-native';

type GateStep = 'branches' | 'institutes' | 'subjects' | 'lectures';

export const GateScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { watchedMap, markLectureWatched, toggleLectureWatched, recordCourseMemory } = useAuth();

  const [step, setStep] = useState<GateStep>('branches');
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const stepSlideX = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;

  const animateStepTransition = useCallback(
    (direction: 'forward' | 'back') => {
      stepSlideX.setValue(direction === 'forward' ? 28 : -28);
      stepOpacity.setValue(0.35);
      Animated.parallel([
        Animated.timing(stepSlideX, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(stepOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [stepSlideX, stepOpacity]
  );

  const goForwardStep = useCallback(
    (nextStep: GateStep) => {
      setStep(nextStep);
      animateStepTransition('forward');
    },
    [animateStepTransition]
  );

  const handleBackStep = useCallback((): boolean => {
    if (step === 'lectures') {
      setStep('subjects');
      setSearchQuery('');
      animateStepTransition('back');
      return true;
    }
    if (step === 'subjects') {
      setStep('institutes');
      animateStepTransition('back');
      return true;
    }
    if (step === 'institutes') {
      setStep('branches');
      animateStepTransition('back');
      return true;
    }
    return false;
  }, [step, animateStepTransition]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        return handleBackStep();
      });
      return () => sub.remove();
    }, [handleBackStep])
  );

  useEffect(() => {
    let active = true;
    loadCourseDetails('gate-ece-made-easy-signal-system').then((loaded) => {
      if (active) {
        setCourse(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const lectures = useMemo<LectureItem[]>(() => {
    if (!course?.tabs || course.tabs.length === 0) return [];
    const all = course.tabs.flatMap((t) => t.items);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [course, searchQuery]);

  const reloadGateCourse = useCallback(async () => {
    const loaded = await loadCourseDetails('gate-ece-made-easy-signal-system');
    if (loaded) setCourse(loaded);
  }, []);

  const { refreshControl } = usePullToRefresh(reloadGateCourse);

  const onHeaderBackPress = () => {
    const handled = handleBackStep();
    if (!handled) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate('MainTabs', { screen: 'CoursesTab' });
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <Animated.View
          style={{
            opacity: stepOpacity,
            transform: [{ translateX: stepSlideX }],
          }}
        >
          {/* Breadcrumb */}
          <View style={styles.breadcrumbRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onHeaderBackPress}>
              <ArrowLeft size={14} color={colors.accent} />
              <Text style={[styles.backBtnText, { color: colors.accent }]}>Back</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textDim }}>/</Text>
            <Text style={[styles.breadcrumbText, { color: colors.textMuted }]} numberOfLines={1}>
              GATE {step !== 'branches' ? '› ECE' : ''}
              {step === 'subjects' || step === 'lectures' ? ' › Made Easy' : ''}
              {step === 'lectures' ? ' › Signals & Systems' : ''}
            </Text>
          </View>

          {/* Title Header */}
          <View style={styles.headerBlock}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Cpu size={22} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                {step === 'branches' && 'GATE Engineering Branches'}
                {step === 'institutes' && 'ECE — Select Coaching Portal'}
                {step === 'subjects' && 'Made Easy — ECE Subjects'}
                {step === 'lectures' && 'Signals and Systems (36 Lectures)'}
              </Text>
              <Text style={[styles.pageSub, { color: colors.textMuted }]}>
                {step === 'branches' && 'Select your engineering branch to access curated GATE lectures.'}
                {step === 'institutes' && 'Choose an educator or institute track.'}
                {step === 'subjects' && 'Browse structured subject folders with lecture tracking.'}
                {step === 'lectures' && 'Made Easy premier lectures covering Signals, Fourier, Laplace & Z-Transform.'}
              </Text>
            </View>
          </View>

          {/* STEP 1: BRANCHES */}
          {step === 'branches' && (
            <TouchableOpacity
              style={[
                styles.drillCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => goForwardStep('institutes')}
              activeOpacity={0.82}
            >
              <View style={styles.drillTop}>
                <View style={[styles.drillIconBox, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Cpu size={22} color="#f59e0b" />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#f59e0b' }]}>ECE Branch</Text>
                </View>
              </View>
              <Text style={[styles.drillTitle, { color: colors.text }]}>
                Electronics &amp; Communication (ECE)
              </Text>
              <Text style={[styles.drillDesc, { color: colors.textMuted }]}>
                Structured GATE ECE core subjects with full high-definition lecture playlists.
              </Text>
              <View style={[styles.drillFooter, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.drillFooterMeta, { color: colors.textDim }]}>
                  1 Premier Institute Available
                </Text>
                <View style={styles.exploreRow}>
                  <Text style={[styles.exploreText, { color: colors.accent }]}>Open Branch</Text>
                  <ArrowRight size={14} color={colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* STEP 2: INSTITUTES */}
          {step === 'institutes' && (
            <TouchableOpacity
              style={[
                styles.drillCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => goForwardStep('subjects')}
              activeOpacity={0.82}
            >
              <View style={styles.drillTop}>
                <View style={[styles.drillIconBox, { backgroundColor: colors.govtDim }]}>
                  <GraduationCap size={22} color={colors.govtIndigo} />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: colors.govtDim }]}>
                  <Text style={[styles.pillBadgeText, { color: colors.govtIndigo }]}>
                    Premier Batch
                  </Text>
                </View>
              </View>
              <Text style={[styles.drillTitle, { color: colors.text }]}>Made Easy Education</Text>
              <Text style={[styles.drillDesc, { color: colors.textMuted }]}>
                Complete subject modules taught by senior Made Easy GATE faculty.
              </Text>
              <View style={[styles.drillFooter, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.drillFooterMeta, { color: colors.textDim }]}>
                  1 Subject Ready
                </Text>
                <View style={styles.exploreRow}>
                  <Text style={[styles.exploreText, { color: colors.govtIndigo }]}>
                    Open Portal
                  </Text>
                  <ArrowRight size={14} color={colors.govtIndigo} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* STEP 3: SUBJECTS */}
          {step === 'subjects' && (
            <TouchableOpacity
              style={[
                styles.drillCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
              onPress={() => goForwardStep('lectures')}
              activeOpacity={0.82}
            >
              <View style={styles.drillTop}>
                <View style={[styles.drillIconBox, { backgroundColor: 'rgba(204,120,92,0.12)' }]}>
                  <Folder size={22} color={colors.accent} />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: 'rgba(204,120,92,0.12)' }]}>
                  <Video size={12} color={colors.accent} />
                  <Text style={[styles.pillBadgeText, { color: colors.accent }]}>
                    {course?.stats?.videos || 36} Lectures
                  </Text>
                </View>
              </View>
              <Text style={[styles.drillTitle, { color: colors.text }]}>
                Signals and Systems
              </Text>
              <Text style={[styles.drillDesc, { color: colors.textMuted }]}>
                Continuous &amp; Discrete Signals, LTI Systems, Fourier Series/Transform, Laplace,
                Z-Transform &amp; Sampling.
              </Text>
              <View style={[styles.drillFooter, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.drillFooterMeta, { color: colors.textDim }]}>
                  Full Video Series
                </Text>
                <View style={styles.exploreRow}>
                  <Text style={[styles.exploreText, { color: colors.accent }]}>
                    Open Lectures
                  </Text>
                  <ArrowRight size={14} color={colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* STEP 4: LECTURES */}
          {step === 'lectures' && (
            <View>
              <View
                style={[
                  styles.searchWrap,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <Search size={16} color={colors.textDim} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search Signals & Systems lectures..."
                  placeholderTextColor={colors.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={colors.textDim} />
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 32 }} />
              ) : (
                <View>
                  {lectures.map((item, idx) => {
                    const watchKey = item.links?.url || item.url || item.id || `${idx}`;
                    return (
                      <LectureRow
                        key={watchKey}
                        item={item}
                        index={idx}
                        isWatched={!!watchedMap[watchKey]}
                        onToggleWatched={() =>
                          toggleLectureWatched('gate-ece-made-easy-signal-system', watchKey)
                        }
                        onPress={() => {
                          markLectureWatched('gate-ece-made-easy-signal-system', watchKey);
                          recordCourseMemory({
                            courseId: 'gate-ece-made-easy-signal-system',
                            courseName: course?.name,
                            lectureTitle: item.label,
                            tabId: 'all',
                            url: watchKey,
                            timestamp: Date.now(),
                          });
                          navigation.navigate('Watch', {
                            lecture: item,
                            courseId: 'gate-ece-made-easy-signal-system',
                            courseTitle: course?.name || 'GATE ECE Signals & Systems',
                          });
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Animated.View>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  breadcrumbText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  drillCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  drillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  drillIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  pillBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  drillTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  drillDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  drillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  drillFooterMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
});
