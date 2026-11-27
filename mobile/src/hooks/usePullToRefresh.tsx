import React, { useState, useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable pull-to-refresh hook for mobile screens.
 * Refreshes user session & cloud watch history and runs an optional screen-specific reloader.
 */
export function usePullToRefresh(extraTask?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const { refreshSessionAndSync } = useAuth();
  const { colors } = useTheme();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshSessionAndSync().catch(() => {}),
        extraTask ? Promise.resolve(extraTask()).catch(() => {}) : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSessionAndSync, extraTask]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}
      progressBackgroundColor={colors.bgCard}
    />
  );

  return { refreshing, onRefresh, refreshControl };
}
