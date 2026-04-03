import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DEFAULT_CALORIE_TARGET } from '../../lib/constants';
import { useTheme } from '../../lib/theme';
import {
  requestNotificationPermission,
  scheduleAllMealReminders,
  scheduleNutritionNudge,
  cancelAllNotifications,
  DEFAULT_MEAL_REMINDER_TIMES,
} from '../../lib/notifications';

const REMINDER_LABELS: Record<string, string> = {
  '08:00': 'Breakfast reminder',
  '12:30': 'Lunch reminder',
  '19:00': 'Dinner reminder',
};

export default function ProfileScreen(): React.JSX.Element {
  const { profile, signOut, updateProfile, toggleTheme, loading } = useAuthStore();
  const { isDark, colors } = useTheme();
  const [target, setTarget] = useState(
    String(profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET)
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ?? false
  );
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    setTarget(String(profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET));
  }, [profile?.dailyCalorieTarget]);

  useEffect(() => {
    setNotificationsEnabled(profile?.notificationsEnabled ?? false);
  }, [profile?.notificationsEnabled]);

  const handleSave = async (): Promise<void> => {
    const val = parseInt(target, 10);
    if (!val || val < 500 || val > 10000) {
      Alert.alert('Invalid value', 'Please enter a calorie target between 500 and 10,000.');
      return;
    }
    try {
      await updateProfile({ dailyCalorieTarget: val });
      Alert.alert('Saved', 'Daily calorie target updated.');
    } catch {
      Alert.alert('Error', 'Failed to update daily calorie target. Please try again.');
    }
  };

  const handleNotificationsToggle = async (value: boolean): Promise<void> => {
    if (value) {
      // Turning on
      try {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Notifications are disabled. Please enable them in your device Settings to receive meal reminders.',
          );
          return;
        }
        setNotificationsEnabled(true);
        await updateProfile({
          notificationsEnabled: true,
          mealReminderTimes: DEFAULT_MEAL_REMINDER_TIMES,
        });
        await scheduleAllMealReminders(DEFAULT_MEAL_REMINDER_TIMES);
        await scheduleNutritionNudge();
      } catch {
        setNotificationsEnabled(false);
        Alert.alert('Error', 'Failed to enable notifications. Please try again.');
      }
    } else {
      // Turning off
      try {
        setNotificationsEnabled(false);
        await cancelAllNotifications();
        await updateProfile({ notificationsEnabled: false });
      } catch {
        setNotificationsEnabled(true);
        Alert.alert('Error', 'Failed to disable notifications. Please try again.');
      }
    }
  };

  const handleSaveNotifications = async (): Promise<void> => {
    setSavingNotifications(true);
    try {
      const times = profile?.mealReminderTimes ?? DEFAULT_MEAL_REMINDER_TIMES;
      await cancelAllNotifications();
      if (notificationsEnabled) {
        await scheduleAllMealReminders(times);
        await scheduleNutritionNudge();
      }
      await updateProfile({
        notificationsEnabled,
        mealReminderTimes: times,
      });
      Alert.alert('Saved', 'Notification settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const reminderTimes = profile?.mealReminderTimes ?? DEFAULT_MEAL_REMINDER_TIMES;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.emoji}>👤</Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.displayName ?? 'User'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Calorie Target</Text>
          <Input
            value={target}
            onChangeText={setTarget}
            keyboardType="number-pad"
            placeholder="2000"
            containerStyle={{ marginBottom: 12 }}
          />
          <Button label="Save Target" onPress={handleSave} loading={loading} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

          <View style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          {notificationsEnabled && reminderTimes.map((time) => {
            const label = REMINDER_LABELS[time] ?? 'Meal reminder';
            return (
              <View
                key={time}
                style={[styles.row, styles.reminderRow, { borderColor: colors.border }]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>{time}</Text>
              </View>
            );
          })}

          <View style={styles.saveNotifBtn}>
            <Button
              label="Save Notification Settings"
              onPress={handleSaveNotifications}
              variant="outline"
              loading={savingNotifications}
            />
          </View>
        </View>

        <Button
          label="Sign Out"
          onPress={signOut}
          variant="outline"
          style={{ marginTop: 4 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, gap: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, fontWeight: '500' },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  rowLabel: {
    fontSize: 15,
  },
  reminderRow: {
    // inherits row styles
  },
  reminderTime: {
    fontSize: 14,
  },
  saveNotifBtn: {
    marginTop: 12,
  },
});
