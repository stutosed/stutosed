import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { BrandSpike } from './BrandSpike';
import { radii, spacing } from '../theme/spacing';

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { openDrawer } = useDrawer();

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Student';
  const firstName = userName.split(' ')[0];
  const initials = getInitials(userName);

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

      {/* Center: Floating Brand Logo Pill (exact match to MobileHeader.tsx) */}
      <View style={styles.centerSlot} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.brandLogoPill,
            {
              backgroundColor: colors.bgCardSubtle,
              borderColor: colors.border,
            },
          ]}
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'HomeTab' })}
          activeOpacity={0.75}
        >
          <BrandSpike size={18} color={colors.accent} />
          <Text style={[styles.brandText, { color: colors.text }]}>stutosed</Text>
        </TouchableOpacity>
      </View>

      {/* Right: Profile Pill or Sign In Pill */}
      <View style={styles.rightSlot}>
        {user ? (
          <TouchableOpacity
            style={[
              styles.avatarPill,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            onPress={() => (navigation as any).navigate('MainTabs', { screen: 'ProfileTab' })}
            activeOpacity={0.75}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
              {firstName}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.signInPill, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
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
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 68,
  },
  signInPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
