import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { API_BASE_URL } from './config';

export const NOTIFICATION_CHANNEL_ID = 'stutosed_updates';
const STUDY_REMINDER_ID = 'stutosed-4hr-study-reminder';
const REMINDER_PREF_KEY = 'stutosed-4hr-reminder-enabled';
const FOUR_HOURS_SECONDS = 4 * 60 * 60;

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

export async function isStudyReminderEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_PREF_KEY);
    // Default ON unless explicitly disabled by user
    return raw !== 'false';
  } catch {
    return true;
  }
}

export async function setStudyReminderEnabled(enabled: boolean): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(STUDY_REMINDER_ID).catch(() => {});
    // Also clean up any earlier daily reminder id if present
    await Notifications.cancelScheduledNotificationAsync('stutosed-daily-study-reminder').catch(() => {});

    if (!enabled) {
      await AsyncStorage.setItem(REMINDER_PREF_KEY, 'false');
      return false;
    }

    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted) {
      await AsyncStorage.setItem(REMINDER_PREF_KEY, 'false');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: STUDY_REMINDER_ID,
      content: {
        title: 'Time to Study on stutosed',
        body: 'Quick check-in: watch a lecture or revise your PDF notes to keep your streak alive.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: FOUR_HOURS_SECONDS,
        repeats: true,
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
    });

    await AsyncStorage.setItem(REMINDER_PREF_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultFourHourReminder(): Promise<void> {
  try {
    const enabled = await isStudyReminderEnabled();
    if (!enabled) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = scheduled.some((item) => item.identifier === STUDY_REMINDER_ID);
    if (!alreadyScheduled) {
      await setStudyReminderEnabled(true);
    }
  } catch {}
}

/**
 * Initializes basic local notifications + auto-schedules the 4-hour study reminder,
 * and safely registers Expo Push Token when EAS/FCM config is present.
 */
export async function registerForPushNotificationsAsync(
  userId?: string | null
): Promise<string | null> {
  try {
    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted || Platform.OS === 'web') {
      return null;
    }

    await ensureDefaultFourHourReminder();

    if (!Device.isDevice) {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      return null;
    }

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
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
    return null;
  }
}

export async function sendTestLocalNotification(): Promise<boolean> {
  try {
    const granted = await ensureNotificationChannelAndPermissions();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'stutosed Study Reminder Active',
        body: 'Basic notifications are active. You will be reminded every 4 hours.',
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
