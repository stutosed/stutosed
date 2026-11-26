import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider, useDrawer } from './src/context/DrawerContext';
import { SidebarDrawer } from './src/components/SidebarDrawer';
import { PrivacyTermsModal } from './src/components/PrivacyTermsModal';

const AppShell: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { privacyModal, closePrivacyModal } = useDrawer();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.bgCard,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.bgCard,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <SidebarDrawer />
      <PrivacyTermsModal
        visible={privacyModal.isOpen}
        initialTab={privacyModal.tab}
        onClose={closePrivacyModal}
      />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DrawerProvider>
            <AppShell />
          </DrawerProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
