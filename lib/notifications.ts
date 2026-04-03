import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const DEFAULT_MEAL_REMINDER_TIMES: string[] = ['08:00', '12:30', '19:00'];

function getMealLabel(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 10) return 'Breakfast';
  if (hour < 15) return 'Lunch';
  if (hour < 21) return 'Dinner';
  return 'Meal';
}

/**
 * Configure the global notification handler. Call once at app startup.
 * Channel creation for Android is done asynchronously in a fire-and-forget call.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    }).catch(() => {
      // Non-fatal — channel will be created on next launch if this fails.
    });
  }
}

/**
 * Request notification permission from the OS.
 * Returns true when permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule a daily repeating meal reminder at the given "HH:MM" time.
 * Returns the notification identifier.
 */
export async function scheduleMealReminder(time: string, mealLabel: string): Promise<string> {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for ${mealLabel}!`,
      body: "Don't forget to log your meal.",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });

  return id;
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Ignore — notification may have already fired or been removed.
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore.
  }
}

/**
 * Schedule daily meal reminders for each time in the provided array.
 * Returns an array of notification identifiers.
 */
export async function scheduleAllMealReminders(times: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const time of times) {
    try {
      const label = getMealLabel(time);
      const id = await scheduleMealReminder(time, label);
      ids.push(id);
    } catch {
      // Skip times that fail to schedule rather than aborting the whole batch.
    }
  }
  return ids;
}

/**
 * Send an immediate local notification — used for streak and reward alerts.
 */
export async function sendRewardNotification(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // Non-fatal — never crash the app because a reward notification failed.
  }
}

/**
 * Schedule a daily nutrition nudge at 15:00.
 */
export async function scheduleNutritionNudge(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nutrition Check-in',
        body: 'How are you tracking with your goals today? Log your afternoon meals!',
        sound: true,
      },
      trigger: {
        hour: 15,
        minute: 0,
        repeats: true,
      },
    });
  } catch {
    // Non-fatal.
  }
}
