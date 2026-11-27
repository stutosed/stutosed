import React, { useState, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'react-native-drawer-layout';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { DrawerProvider, useDrawer } from './src/context/DrawerContext';
import { SidebarDrawer, DRAWER_WIDTH } from './src/components/SidebarDrawer';
import { PrivacyTermsModal } from './src/components/PrivacyTermsModal';

const AppShell: React.FC = () => {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { isOpen, openDrawer, closeDrawer, privacyModal, closePrivacyModal } = useDrawer();
  const [isWatchScreen, setIsWatchScreen] = useState(false);

  const handleNavStateChange = useCallback(() => {
    try {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        setIsWatchScreen(route?.name === 'Watch');
      }
    } catch {}
  }, []);

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

  const renderDrawer = useCallback(() => <SidebarDrawer />, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={handleNavStateChange}
      onStateChange={handleNavStateChange}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Drawer
        open={isOpen}
        onOpen={openDrawer}
        onClose={closeDrawer}
        drawerType="slide"
        drawerPosition="left"
        drawerStyle={{ width: DRAWER_WIDTH, backgroundColor: colors.bgCard }}
        overlayStyle={{ backgroundColor: 'rgba(18, 17, 16, 0.14)' }}
        swipeEnabled={!isWatchScreen}
        swipeEdgeWidth={Math.max(140, Math.round(width * 0.68))}
        swipeMinDistance={28}
        swipeMinVelocity={350}
        configureGestureHandler={(gesture) =>
          gesture.activeOffsetX([-20, 20]).failOffsetY([-12, 12])
        }
        renderDrawerContent={renderDrawer}
      >
        <RootNavigator />
      </Drawer>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <DrawerProvider>
              <AppShell />
            </DrawerProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
