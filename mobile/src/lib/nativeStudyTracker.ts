import AsyncStorage from '@react-native-async-storage/async-storage';

const NATIVE_STUDY_LOG_KEY = 'stutosed_native_study_log_v1';
const WEEKLY_LECTURE_GOAL = 14;

export interface NativeStudyLog {
  dailyMinutes: Record<string, number>;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadStudyMinutesToday(): Promise<{
  todayMinutes: number;
  dailyMinutes: Record<string, number>;
}> {
  try {
    const raw = await AsyncStorage.getItem(NATIVE_STUDY_LOG_KEY);
    const parsed: NativeStudyLog = raw ? JSON.parse(raw) : { dailyMinutes: {} };
    const dailyMinutes = parsed?.dailyMinutes || {};
    const todayKey = getLocalDateKey();
    return {
      todayMinutes: dailyMinutes[todayKey] || 0,
      dailyMinutes,
    };
  } catch {
    return { todayMinutes: 0, dailyMinutes: {} };
  }
}

export async function incrementStudyMinutesToday(deltaMinutes: number): Promise<number> {
  if (deltaMinutes <= 0) {
    const current = await loadStudyMinutesToday();
    return current.todayMinutes;
  }
  try {
    const raw = await AsyncStorage.getItem(NATIVE_STUDY_LOG_KEY);
    const parsed: NativeStudyLog = raw ? JSON.parse(raw) : { dailyMinutes: {} };
    const dailyMinutes = { ...(parsed?.dailyMinutes || {}) };
    const todayKey = getLocalDateKey();
    const updated = (dailyMinutes[todayKey] || 0) + deltaMinutes;
    dailyMinutes[todayKey] = updated;
    await AsyncStorage.setItem(NATIVE_STUDY_LOG_KEY, JSON.stringify({ dailyMinutes }));
    return updated;
  } catch {
    return deltaMinutes;
  }
}

export function computeDashboardMetrics(
  watchedMap: Record<string, number>,
  dailyMinutes: Record<string, number>
): {
  streakDays: number;
  lecturesToday: number;
  weeklyGoalPct: number;
  totalWatched: number;
} {
  const activeDaySet = new Set<string>();
  const todayKey = getLocalDateKey();
  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - 6 * 24 * 60 * 60 * 1000;
  const sevenDayStart = new Date(sevenDaysAgoMs);
  sevenDayStart.setHours(0, 0, 0, 0);

  let lecturesToday = 0;
  let lecturesLast7Days = 0;

  for (const ts of Object.values(watchedMap)) {
    if (!ts || typeof ts !== 'number') continue;
    const dt = new Date(ts);
    const key = getLocalDateKey(dt);
    activeDaySet.add(key);
    if (key === todayKey) {
      lecturesToday++;
    }
    if (ts >= sevenDayStart.getTime()) {
      lecturesLast7Days++;
    }
  }

  for (const [dayKey, mins] of Object.entries(dailyMinutes)) {
    if (mins >= 5) {
      activeDaySet.add(dayKey);
    }
  }

  // Consecutive streak ending today (or yesterday if not studied yet today)
  let streakDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDaySet.has(getLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (activeDaySet.has(getLocalDateKey(cursor))) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weeklyGoalPct = Math.min(
    100,
    Math.round((lecturesLast7Days / WEEKLY_LECTURE_GOAL) * 100)
  );

  return {
    streakDays,
    lecturesToday,
    weeklyGoalPct,
    totalWatched: Object.keys(watchedMap).length,
  };
}

export function formatStudyDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
