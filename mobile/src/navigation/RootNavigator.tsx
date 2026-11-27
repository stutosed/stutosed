import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BottomTabNavigator } from './BottomTabNavigator';
import { CourseDetailScreen } from '../screens/CourseDetailScreen';
import { WatchScreen } from '../screens/WatchScreen';
import { GovtExamsScreen } from '../screens/GovtExamsScreen';
import { GateScreen } from '../screens/GateScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { AuthScreen } from '../screens/AuthScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'ios_from_right',
        animationDuration: 260,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Watch" component={WatchScreen} />
      <Stack.Screen name="GovtExams" component={GovtExamsScreen} />
      <Stack.Screen name="Gate" component={GateScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack.Navigator>
  );
};
