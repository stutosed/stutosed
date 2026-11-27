import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { navigationRef } from '../navigation/navigationRef';
import { BrandSpike } from './BrandSpike';
import { spacing, radii } from '../theme/spacing';
import {
  Home,
  Landmark,
  Layers,
  Cpu,
  BookmarkCheck,
  User,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  X,
} from 'lucide-react-native';

const DRAWER_WIDTH = 282;

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const SidebarDrawer: React.FC = () => {
  const { isOpen, closeDrawer } = useDrawer();
  const { theme, colors, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(isOpen);
  const [activeRouteName, setActiveRouteName] = useState<string>('HomeTab');
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const navStagger = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (isOpen) {
      try {
        if (navigationRef.isReady()) {
          const current = navigationRef.getCurrentRoute();
          if (current?.name) setActiveRouteName(current.name);
        }
      } catch {}

      setModalVisible(true);
      slideX.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      navStagger.forEach((v) => v.setValue(0));

      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          damping: 25,
          stiffness: 260,
          mass: 0.85,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          32,
          navStagger.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 210,
              delay: 50,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -DRAWER_WIDTH,
          duration: 195,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 185,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [isOpen, modalVisible, slideX, backdropOpacity, navStagger]);

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = getInitials(userName);

  const navigateTab = (tabName: 'HomeTab' | 'CoursesTab' | 'LibraryTab' | 'ProfileTab') => {
    closeDrawer();
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate('MainTabs', { screen: tabName });
      }
    }, 160);
  };

  const navigateScreen = (screenName: 'GovtExams' | 'Gate' | 'Help' | 'Auth') => {
    closeDrawer();
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate(screenName);
      }
    }, 160);
  };

  const closeDrawerRef = useRef(closeDrawer);
  closeDrawerRef.current = closeDrawer;

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dx < -16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => {
        const clampedX = Math.max(-DRAWER_WIDTH, Math.min(0, gesture.dx));
        slideX.setValue(clampedX);
        backdropOpacity.setValue(1 + clampedX / DRAWER_WIDTH);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -65 || gesture.vx < -0.4) {
          closeDrawerRef.current();
        } else {
          Animated.parallel([
            Animated.timing(slideX, {
              toValue: 0,
              duration: 180,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlayRoot} {...drawerPanResponder.panHandlers}>
        {/* Animated Backdrop */}
        <Animated.View style={[styles.backdropWrap, { opacity: backdropOpacity }]}>
          <Pressable style={styles.backdropPress} onPress={closeDrawer} />
        </Animated.View>

        {/* Animated Slide-in Left Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.bgCard,
              borderRightColor: colors.border,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <SafeAreaView style={styles.drawerSafe} edges={['top', 'bottom']}>
            {/* Brand Header */}
            <View style={[styles.brandRow, { borderBottomColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={styles.brandLeft}
                onPress={() => navigateTab('HomeTab')}
                activeOpacity={0.75}
              >
                <BrandSpike size={24} color={colors.accent} />
                <Text style={[styles.brandText, { color: colors.text }]}>stutosed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeDrawer}
                style={[
                  styles.closeIconBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Main Navigation Links */}
            <ScrollView
              style={styles.navScroll}
              contentContainerStyle={styles.navList}
              showsVerticalScrollIndicator={false}
            >
              {[
                {
                  key: 'HomeTab',
                  label: 'Home',
                  icon: Home,
                  iconColor: colors.textMuted,
                  onPress: () => navigateTab('HomeTab'),
                },
                {
                  key: 'CoursesTab',
                  label: 'All Courses',
                  icon: Layers,
                  iconColor: colors.accent,
                  onPress: () => navigateTab('CoursesTab'),
                },
                {
                  key: 'GovtExams',
                  label: 'Govt Exams',
                  icon: Landmark,
                  iconColor: colors.govtIndigo,
                  onPress: () => navigateScreen('GovtExams'),
                },
                {
                  key: 'Gate',
                  label: 'GATE',
                  icon: Cpu,
                  iconColor: colors.orange,
                  onPress: () => navigateScreen('Gate'),
                },
                {
                  key: 'LibraryTab',
                  label: 'My Library',
                  icon: BookmarkCheck,
                  iconColor: colors.textMuted,
                  onPress: () => navigateTab('LibraryTab'),
                },
                {
                  key: 'ProfileTab',
                  label: 'Profile',
                  icon: User,
                  iconColor: colors.textMuted,
                  onPress: () => navigateTab('ProfileTab'),
                },
                {
                  key: 'Help',
                  label: 'Help & Community',
                  icon: HelpCircle,
                  iconColor: colors.textMuted,
                  onPress: () => navigateScreen('Help'),
                },
              ].map((item, idx) => {
                const animVal = navStagger[idx];
                const isActive = activeRouteName === item.key;
                const IconComp = item.icon;
                return (
                  <Animated.View
                    key={item.key}
                    style={{
                      opacity: animVal,
                      transform: [
                        {
                          translateX: animVal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.navItem,
                        isActive && { backgroundColor: 'rgba(204, 120, 92, 0.11)' },
                      ]}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={18}
                        color={isActive ? colors.accent : item.iconColor}
                      />
                      <Text
                        style={[
                          styles.navLabel,
                          { color: isActive ? colors.accent : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* Bottom Toolbar: Theme Toggle + Account */}
            <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.bottomBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                onPress={toggleTheme}
                activeOpacity={0.75}
              >
                <View style={styles.bottomBtnLeft}>
                  {theme === 'light' ? (
                    <Sun size={17} color={colors.orange} />
                  ) : (
                    <Moon size={17} color={colors.accent} />
                  )}
                  <Text style={[styles.bottomBtnText, { color: colors.text }]}>
                    {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.activeBadgeText, { color: colors.textDim }]}>Active</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.bottomBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                onPress={() => {
                  if (user) navigateTab('ProfileTab');
                  else navigateScreen('Auth');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.bottomBtnLeft}>
                  {user?.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={[styles.avatarImg, { borderColor: colors.accent }]}
                    />
                  ) : user ? (
                    <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  ) : (
                    <User size={17} color={colors.accent} />
                  )}
                  <Text style={[styles.bottomBtnText, { color: colors.text }]} numberOfLines={1}>
                    {user ? userName : 'Sign In'}
                  </Text>
                </View>
                {!user && <Sparkles size={14} color={colors.accent} />}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    position: 'relative',
  },
  backdropWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 17, 16, 0.58)',
  },
  backdropPress: {
    flex: 1,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    maxWidth: '84%',
    borderRightWidth: 1,
    paddingHorizontal: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerSafe: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navScroll: {
    flex: 1,
  },
  navList: {
    gap: 4,
    paddingVertical: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: radii.md,
  },
  navLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  bottomBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
