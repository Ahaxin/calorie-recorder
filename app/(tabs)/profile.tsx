import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth-store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { COLORS, DEFAULT_CALORIE_TARGET } from '../../lib/constants';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile, loading } = useAuthStore();
  const [target, setTarget] = useState(
    String(profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET)
  );

  useEffect(() => {
    setTarget(String(profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET));
  }, [profile?.dailyCalorieTarget]);

  const handleSave = async () => {
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>👤</Text>
          <Text style={styles.name}>{profile?.displayName ?? 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Calorie Target</Text>
          <Input
            value={target}
            onChangeText={setTarget}
            keyboardType="number-pad"
            placeholder="2000"
            containerStyle={{ marginBottom: 12 }}
          />
          <Button label="Save Target" onPress={handleSave} loading={loading} />
        </View>

        <Button
          label="Sign Out"
          onPress={signOut}
          variant="outline"
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 24, gap: 20 },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
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
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary },
  section: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    marginBottom: 8,
  },
});
