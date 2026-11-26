import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { GovtExamsScreen } from '../screens/GovtExamsScreen';
import { BeuScreen } from '../screens/BeuScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Home, Landmark, GraduationCap, BookOpen, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="GovtTab"
        component={GovtExamsScreen}
        options={{
          tabBarLabel: 'Govt',
          tabBarIcon: ({ color, size }) => <Landmark size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="BeuTab"
        component={BeuScreen}
        options={{
          tabBarLabel: 'B.Tech',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: user ? 'Profile' : 'Account',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
