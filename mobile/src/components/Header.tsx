import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { BrandSpike } from './BrandSpike';
import { radii, spacing } from '../theme/spacing';
import {
  User,
  BookmarkCheck,
  BookOpen,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react-native';

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { theme, colors, toggleTheme } = useTheme();
  const { user, signOutUser } = useAuth();
  const { openDrawer } = useDrawer();

  const [menuOpen, setMenuOpen] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.94)).current;
  const popupY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (menuOpen) {
      popupOpacity.setValue(0);
      popupScale.setValue(0.94);
      popupY.setValue(-8);
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(popupScale, {
          toValue: 1,
          damping: 20,
          stiffness: 280,
          mass: 0.75,
          useNativeDriver: true,
        }),
        Animated.timing(popupY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuOpen, popupOpacity, popupScale, popupY]);

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Advik';
  const initials = getInitials(userName);

  const handleNavigateTab = (tab: 'HomeTab' | 'CoursesTab' | 'LibraryTab' | 'ProfileTab') => {
    setMenuOpen(false);
    (navigation as any).navigate('MainTabs', { screen: tab });
  };

  const handleNavigateScreen = (screen: 'GovtExams' | 'Help' | 'Auth') => {
    setMenuOpen(false);
    (navigation as any).navigate(screen);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Left: Hamburger Button */}
      <TouchableOpacity
        style={styles.hamburgerBtn}
        onPress={openDrawer}
        activeOpacity={0.7}
        accessibilityLabel="Toggle Navigation Menu"
      >
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text, width: 13 }]} />
      </TouchableOpacity>

      {/* Center: Floating Brand Logo Pill (with rotating BrandSpike) */}
      <View style={styles.centerSlot} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.brandLogoPill,
            {
              backgroundColor: colors.bgCardSubtle,
              borderColor: colors.border,
            },
          ]}
          onPress={() => handleNavigateTab('HomeTab')}
          activeOpacity={0.75}
        >
          <BrandSpike size={18} color={colors.accent} />
          <Text style={[styles.brandText, { color: colors.text }]}>stutosed</Text>
        </TouchableOpacity>
      </View>

      {/* Right: Circular Sign In (Guest) OR Circular Avatar Only + Profile Popup (Logged In) */}
      <View style={styles.rightSlot}>
        {user ? (
          <TouchableOpacity
            style={[
              styles.circularTrigger,
              {
                backgroundColor: colors.bgCardSubtle,
                borderColor: menuOpen ? colors.accent : colors.border,
              },
            ]}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="User Account Menu"
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.circularSignInBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
            accessibilityLabel="Sign In"
          >
            <User size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Dropdown Popup Modal (Exact Web ProfileMenu.tsx replica) */}
      {user && (
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuOpen(false)}>
            <Animated.View
              style={[
                styles.dropdownCard,
                {
                  top: insets.top + 56,
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                  opacity: popupOpacity,
                  transform: [{ translateY: popupY }, { scale: popupScale }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
              {/* User Summary Row */}
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                {user.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={[styles.dropdownAvatarImg, { borderColor: colors.accent }]}
                  />
                ) : (
                  <View style={[styles.dropdownAvatarCircle, { backgroundColor: colors.accent }]}>
                    <Text style={styles.dropdownAvatarInitials}>{initials}</Text>
                  </View>
                )}

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.dropdownName, { color: colors.text }]} numberOfLines={1}>
                    {userName}
                  </Text>
                  <View style={styles.verifiedRow}>
                    <ShieldCheck size={12} color={colors.accent} />
                    <Text style={[styles.verifiedText, { color: colors.accent }]}>
                      Verified Student
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Items matching ProfileMenu.tsx */}
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigateTab('ProfileTab')}
                  activeOpacity={0.7}
                >
                  <User size={15} color={colors.accent} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    My Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigateTab('LibraryTab')}
                  activeOpacity={0.7}
                >
                  <BookmarkCheck size={15} color={colors.accent} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    My Library
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigateScreen('GovtExams')}
                  activeOpacity={0.7}
                >
                  <BookOpen size={15} color={colors.beuBlue} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    Govt Exams
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dropdownItem, { justifyContent: 'space-between' }]}
                  onPress={toggleTheme}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownItemLeft}>
                    {theme === 'light' ? (
                      <Moon size={15} color={colors.accent} />
                    ) : (
                      <Sun size={15} color={colors.orange} />
                    )}
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Theme</Text>
                  </View>
                  <View
                    style={[
                      styles.themeTag,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.themeTagText, { color: colors.textDim }]}>
                      {theme === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigateScreen('Help')}
                  activeOpacity={0.7}
                >
                  <HelpCircle size={15} color={colors.govtIndigo} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    Help &amp; Community
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={async () => {
                  setMenuOpen(false);
                  await signOutUser();
                }}
                activeOpacity={0.7}
              >
                <LogOut size={15} color={colors.red} />
                <Text style={[styles.signOutText, { color: colors.red }]}>Sign Out</Text>
              </TouchableOpacity>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    position: 'relative',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
    gap: 4.5,
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    borderRadius: 2,
  },
  centerSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: radii.pill,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandText: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularTrigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  circularSignInBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cc785c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 17, 16, 0.18)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 14,
    width: 235,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  dropdownAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  dropdownAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarInitials: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownList: {
    gap: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  themeTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  signOutText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
