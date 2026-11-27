import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabParamList, RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { HomeScreen } from '../screens/HomeScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CourseDetailScreen } from '../screens/CourseDetailScreen';
import { GovtExamsScreen } from '../screens/GovtExamsScreen';
import { GateScreen } from '../screens/GateScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { Home, Layers, BookOpen, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

function createTabStack(
  rootName: string,
  RootComponent: React.ComponentType<any>
): React.FC {
  const InnerStack = createNativeStackNavigator<Record<string, object | undefined>>();

  const TabStackNavigator: React.FC = () => {
    const { colors } = useTheme();
    return (
      <InnerStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'ios_from_right',
          animationDuration: 260,
          gestureEnabled: true,
        }}
      >
        <InnerStack.Screen name={rootName} component={RootComponent} />
        <InnerStack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <InnerStack.Screen name="GovtExams" component={GovtExamsScreen} />
        <InnerStack.Screen name="Gate" component={GateScreen} />
        <InnerStack.Screen name="Help" component={HelpScreen} />
      </InnerStack.Navigator>
    );
  };

  return TabStackNavigator;
}

const HomeStack = createTabStack('HomeRoot', HomeScreen);
const CoursesStack = createTabStack('CoursesRoot', CoursesScreen);
const LibraryStack = createTabStack('LibraryRoot', LibraryScreen);
const ProfileStack = createTabStack('ProfileRoot', ProfileScreen);

// Keep RootStackParamList imported for type compatibility
export type TabInnerRoutes = keyof Pick<
  RootStackParamList,
  'CourseDetail' | 'GovtExams' | 'Gate' | 'Help'
>;

const tabSceneInterpolator: NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']> = ({
  current,
}) => ({
  sceneStyle: {
    opacity: 1,
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-24, 0, 24],
        }),
      },
      {
        scale: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.985, 1, 0.985],
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (isOpenRef.current) return false;
        return (
          gesture.dx > 22 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.8
        );
      },
      onPanResponderRelease: (_, gesture) => {
        if (isOpenRef.current) return;
        if (
          (gesture.dx > 52 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5) ||
          (gesture.dx > 26 && gesture.vx > 0.35)
        ) {
          openDrawerRef.current();
        }
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
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
          sceneStyleInterpolator: tabSceneInterpolator,
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 210,
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
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, Home, color),
          }}
        />
        <Tab.Screen
          name="CoursesTab"
          component={CoursesStack}
          options={{
            tabBarLabel: 'Courses',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, Layers, color),
          }}
        />
        <Tab.Screen
          name="LibraryTab"
          component={LibraryStack}
          options={{
            tabBarLabel: 'Library',
            tabBarIcon: ({ focused, color }) => renderIcon(focused, BookOpen, color),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
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
