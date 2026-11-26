import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
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
  GraduationCap,
  Cpu,
  BookmarkCheck,
  User,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  X,
} from 'lucide-react-native';

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const SidebarDrawer: React.FC = () => {
  const { isOpen, closeDrawer } = useDrawer();
  const { theme, isDark, colors, toggleTheme } = useTheme();
  const { user } = useAuth();

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = getInitials(userName);

  const navigateTab = (tabName: 'HomeTab' | 'GovtTab' | 'BeuTab' | 'LibraryTab' | 'ProfileTab') => {
    closeDrawer();
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('MainTabs', { screen: tabName });
    }
  };

  const navigateScreen = (screenName: 'Gate' | 'Help' | 'Auth') => {
    closeDrawer();
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate(screenName);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlayRoot}>
        {/* Sidebar Drawer Panel (Left Side matching Sidebar.tsx) */}
        <SafeAreaView
          style={[
            styles.drawerPanel,
            { backgroundColor: colors.bgCard, borderRightColor: colors.border },
          ]}
          edges={['top', 'bottom']}
        >
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
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateTab('HomeTab')}
              activeOpacity={0.7}
            >
              <Home size={18} color={colors.textMuted} />
              <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateTab('GovtTab')}
              activeOpacity={0.7}
            >
              <Landmark size={18} color={colors.govtIndigo} />
              <Text style={[styles.navLabel, { color: colors.text }]}>Govt Exams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateTab('BeuTab')}
              activeOpacity={0.7}
            >
              <GraduationCap size={18} color={colors.beuBlue} />
              <Text style={[styles.navLabel, { color: colors.text }]}>BEU Engineering</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateScreen('Gate')}
              activeOpacity={0.7}
            >
              <Cpu size={18} color={colors.orange} />
              <View style={styles.navLabelRow}>
                <Text style={[styles.navLabel, { color: colors.text }]}>GATE Engineering</Text>
                <View style={[styles.catBadge, { backgroundColor: `${colors.orange}18` }]}>
                  <Text style={[styles.catBadgeText, { color: colors.orange }]}>1 Subject</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateTab('LibraryTab')}
              activeOpacity={0.7}
            >
              <BookmarkCheck size={18} color={colors.textMuted} />
              <Text style={[styles.navLabel, { color: colors.text }]}>My Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateTab('ProfileTab')}
              activeOpacity={0.7}
            >
              <User size={18} color={colors.textMuted} />
              <Text style={[styles.navLabel, { color: colors.text }]}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateScreen('Help')}
              activeOpacity={0.7}
            >
              <HelpCircle size={18} color={colors.textMuted} />
              <Text style={[styles.navLabel, { color: colors.text }]}>Help &amp; Community</Text>
            </TouchableOpacity>
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

        {/* Backdrop right side */}
        <Pressable style={styles.backdrop} onPress={closeDrawer} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerPanel: {
    width: 276,
    maxWidth: '82%',
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: spacing.base,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 17, 16, 0.55)',
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
