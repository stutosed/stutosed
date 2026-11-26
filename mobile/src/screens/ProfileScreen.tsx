import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { Header } from '../components/Header';
import { spacing, radii } from '../theme/spacing';
import {
  LogOut,
  LogIn,
  Sun,
  Moon,
  Cpu,
  RefreshCw,
  CheckCircle2,
  BookmarkCheck,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Scale,
} from 'lucide-react-native';

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, colors, toggleTheme } = useTheme();
  const { openPrivacyModal } = useDrawer();
  const {
    user,
    studentId,
    isSyncing,
    watchedMap,
    bookmarks,
    refreshSessionAndSync,
    signOutUser,
  } = useAuth();

  const watchedCount = Object.keys(watchedMap).length;
  const bookmarkCount = bookmarks.length;
  const displayName = user?.full_name || 'Guest Student';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile & Settings</Text>

        {/* User Account Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <View style={styles.profileTop}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={[styles.avatarImg, { borderColor: colors.accent }]}
              />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>
                  {user ? getInitials(displayName) : 'ST'}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {user ? user.email : `Guest ID: ${studentId.slice(0, 14)}...`}
              </Text>
              <View style={styles.syncStatusRow}>
                <ShieldCheck size={12} color={user ? colors.green : colors.orange} />
                <Text
                  style={[
                    styles.syncStatusText,
                    { color: user ? colors.green : colors.orange },
                  ]}
                >
                  {user ? 'Cloud Sync Active' : 'Local Storage Only'}
                </Text>
              </View>
            </View>
          </View>

          {!user ? (
            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.8}
            >
              <LogIn size={16} color="#ffffff" />
              <Text style={styles.authBtnText}>Sign In or Create Free Account</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.accountActionsRow}>
              <TouchableOpacity
                style={[
                  styles.smallActionBtn,
                  { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
                ]}
                onPress={refreshSessionAndSync}
                disabled={isSyncing}
              >
                <RefreshCw size={14} color={colors.accent} />
                <Text style={[styles.smallActionText, { color: colors.text }]}>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.smallActionBtn,
                  { backgroundColor: `${colors.red}15`, borderColor: `${colors.red}40` },
                ]}
                onPress={signOutUser}
              >
                <LogOut size={14} color={colors.red} />
                <Text style={[styles.smallActionText, { color: colors.red }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Learning Stats */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <CheckCircle2 size={20} color={colors.green} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{watchedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Watched Lectures</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <BookmarkCheck size={20} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{bookmarkCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Saved Courses</Text>
          </View>
        </View>

        {/* Appearance & Preferences */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: isDark ? `${colors.accent}20` : `${colors.orange}20` },
                ]}
              >
                {isDark ? (
                  <Moon size={18} color={colors.accent} />
                ) : (
                  <Sun size={18} color={colors.orange} />
                )}
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {isDark ? 'Dark Surface Theme' : 'Light Warm Linen Theme'}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  Tap to switch between Light & Dark editorial themes
                </Text>
              </View>
            </View>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* Explore Tracks */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>MORE TRACKS</Text>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Gate')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: `${colors.orange}20` }]}>
                <Cpu size={18} color={colors.orange} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  GATE ECE Engineering
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  Made Easy 36 Lectures Portal
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
            onPress={() => navigation.navigate('Help')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(204,120,92,0.14)' }]}>
                <HelpCircle size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Help &amp; Community Support
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  FAQs, Telegram channel &amp; direct support
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
            onPress={() => openPrivacyModal('privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(22,163,74,0.12)' }]}>
                <Scale size={18} color={colors.green} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Privacy Policy &amp; Terms
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textDim }]}>
                  Student-first fair use &amp; transparency
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionFooter}>
          <Sparkles size={13} color={colors.accent} />
          <Text style={[styles.versionText, { color: colors.textDim }]}>
            stutosed Mobile v1.0.0 • Expo Preview Build
          </Text>
        </View>
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
    paddingBottom: spacing.huge,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  profileCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  authBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  accountActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: 'flex-start',
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  versionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  versionText: {
    fontSize: 11,
  },
});
