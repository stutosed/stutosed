import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { HomeScreen } from '../screens/HomeScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Home, Layers, BookOpen, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabSceneInterpolator: NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']> = ({
  current,
}) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-20, 0, 20],
        }),
      },
    ],
  },
});

interface AnimatedTabIconProps {
  focused: boolean;
  IconComponent: typeof Home;
  color: string;
  accentColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  focused,
  IconComponent,
  color,
  accentColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const barScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.08 : 1,
        damping: 15,
        stiffness: 240,
        useNativeDriver: true,
      }),
      Animated.timing(barScale, {
        toValue: focused ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scaleAnim, barScale]);

  return (
    <View style={styles.iconWrap}>
      <Animated.View
        style={[
          styles.activeBar,
          {
            backgroundColor: accentColor,
            opacity: barScale,
            transform: [{ scaleX: barScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconComponent size={20} strokeWidth={focused ? 2.4 : 1.8} color={color} />
      </Animated.View>
    </View>
  );
};

export const BottomTabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isOpen, openDrawer } = useDrawer();

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const openDrawerRef = useRef(openDrawer);
  openDrawerRef.current = openDrawer;
  const swipeTriggeredRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        if (isOpenRef.current) return false;
        return (
          gesture.dx > 22 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.7
        );
      },
      onPanResponderGrant: () => {
        swipeTriggeredRef.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (!swipeTriggeredRef.current && gesture.dx > 40) {
          swipeTriggeredRef.current = true;
          openDrawerRef.current();
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          !swipeTriggeredRef.current &&
          (gesture.dx > 50 || (gesture.dx > 28 && gesture.vx > 0.35))
        ) {
          openDrawerRef.current();
        }
        swipeTriggeredRef.current = false;
      },
      onPanResponderTerminate: () => {
        swipeTriggeredRef.current = false;
      },
    })
  ).current;

  const renderIcon = (
    focused: boolean,
    IconComponent: typeof Home,
    color: string
  ) => (
    <AnimatedTabIcon
      focused={focused}
      IconComponent={IconComponent}
      color={color}
      accentColor={colors.accent}
    />
  );

  return (
    <View style={styles.swipeContainer} {...panResponder.panHandlers}>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          sceneStyleInterpolator: tabSceneInterpolator,
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 220,
              easing: Easing.out(Easing.cubic),
            },
          },
          tabBarStyle: [
            styles.tabBar,
            { backgroundColor: colors.bgCard, borderTopColor: colors.border },
          ],
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, Home, color),
          }}
        />
        <Tab.Screen
          name="CoursesTab"
          component={CoursesScreen}
          options={{
            tabBarLabel: 'Courses',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, Layers, color),
          }}
        />
        <Tab.Screen
          name="LibraryTab"
          component={LibraryScreen}
          options={{
            tabBarLabel: 'Library',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, BookOpen, color),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, User, color),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 0,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
