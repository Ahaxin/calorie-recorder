import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useOnboardingStore } from '../../stores/onboarding-store';

function isValidDate(day: number, month: number, year: number): boolean {
  if (year < 1924 || year > 2010) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function computeAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

export default function Step3DOB(): React.JSX.Element {
  const { colors } = useTheme();
  const setDateOfBirth = useOnboardingStore((s) => s.setDateOfBirth);

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = (): void => {
    setError(null);
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidDate(d, m, y)) {
      setError('Please enter a valid date. Year must be between 1924 and 2010.');
      return;
    }
    const age = computeAge(d, m, y);
    if (age < 13 || age > 100) {
      setError('You must be between 13 and 100 years old.');
      return;
    }

    const isoString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setDateOfBirth(isoString);
    router.push('/(onboarding)/step4-body');
  };

  const canContinue = day.length > 0 && month.length > 0 && year.length === 4;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step 3 of 5</Text>

        <Text style={[styles.title, { color: colors.text }]}>When were you born?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your age helps us calculate your daily energy needs.
        </Text>

        <View style={styles.row}>
          <Input
            label="Day"
            value={day}
            onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="DD"
            maxLength={2}
            containerStyle={styles.dayInput}
          />
          <Input
            label="Month"
            value={month}
            onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="MM"
            maxLength={2}
            containerStyle={styles.monthInput}
          />
          <Input
            label="Year"
            value={year}
            onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="YYYY"
            maxLength={4}
            containerStyle={styles.yearInput}
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dayInput: {
    flex: 1,
  },
  monthInput: {
    flex: 1,
  },
  yearInput: {
    flex: 1.5,
  },
  errorText: {
    fontSize: 13,
    marginTop: 12,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
  button: {
    width: '100%',
  },
});
