import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radii } from '../theme/spacing';
import { Sparkles, Sun, Moon, LogIn } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'stutosed',
  subtitle = 'Curated Learning Portal',
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, colors, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name.slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderBottomColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.brandBadge,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <Sparkles size={18} color={colors.accent} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          {isDark ? (
            <Sun size={15} color={colors.orange} />
          ) : (
            <Moon size={15} color={colors.accent} />
          )}
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            style={[
              styles.avatarPill,
              { backgroundColor: colors.bgCardSubtle, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.75}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
              {(user.full_name || 'Student').split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <LogIn size={13} color="#ffffff" />
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
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
    maxWidth: 70,
  },
});
