import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { API_BASE_URL } from './config';

export const NOTIFICATION_CHANNEL_ID = 'stutosed_updates';
const DAILY_REMINDER_ID = 'stutosed-daily-study-reminder';
const DAILY_REMINDER_PREF_KEY = 'stutosed-daily-reminder-enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationChannelAndPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Course Updates & Study Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#cc785c',
      sound: 'default',
    }).catch(() => {});
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return status === 'granted';
}

/**
 * Requests notification permission, registers Expo Push Token with Turso when Firebase/EAS is configured,
 * and safely ignores missing-FCM errors on local/offline APK builds so local reminders still work.
 */
export async function registerForPushNotificationsAsync(
  userId?: string | null
): Promise<string | null> {
  try {
    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted || !Device.isDevice || Platform.OS === 'web') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenRes?.data;
    if (!token) return null;

    await fetch(`${API_BASE_URL}/api/v1/notifications/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        userId: userId || undefined,
        deviceName: Device.modelName || undefined,
      }),
    }).catch(() => {});

    return token;
  } catch {
    // Graceful no-op when testing locally or before google-services.json / EAS projectId is linked
    return null;
  }
}

export async function isDailyReminderEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_REMINDER_PREF_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setDailyStudyReminder(enabled: boolean): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

    if (!enabled) {
      await AsyncStorage.setItem(DAILY_REMINDER_PREF_KEY, 'false');
      return false;
    }

    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted) {
      await AsyncStorage.setItem(DAILY_REMINDER_PREF_KEY, 'false');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: 'Time to Study on stutosed!',
        body: 'Continue your batch lectures and practice PDFs to stay ahead on your streak.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(DAILY_REMINDER_PREF_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

export async function sendTestLocalNotification(): Promise<boolean> {
  try {
    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'stutosed Notifications Active',
        body: 'You are ready to receive batch updates and daily study reminders.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}
