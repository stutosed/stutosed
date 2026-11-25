import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { Sparkles } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'stutosed',
  subtitle = 'Curated Learning Portal',
  showBadge = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandIcon}>🎓</Text>
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {showBadge && (
        <View style={styles.proPill}>
          <Sparkles size={13} color={colors.accent} />
          <Text style={styles.proText}>100% Free</Text>
        </View>
      )}
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
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 1,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
});
