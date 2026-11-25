import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';
import { colors } from '../theme/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { GovtExamsScreen } from '../screens/GovtExamsScreen';
import { BeuScreen } from '../screens/BeuScreen';
import { GateScreen } from '../screens/GateScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { Home, Landmark, GraduationCap, Cpu, BookmarkCheck } from 'lucide-react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
          tabBarLabel: 'Govt Exams',
          tabBarIcon: ({ color, size }) => <Landmark size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="BeuTab"
        component={BeuScreen}
        options={{
          tabBarLabel: 'BEU B.Tech',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="GateTab"
        component={GateScreen}
        options={{
          tabBarLabel: 'GATE',
          tabBarIcon: ({ color, size }) => <Cpu size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => <BookmarkCheck size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
