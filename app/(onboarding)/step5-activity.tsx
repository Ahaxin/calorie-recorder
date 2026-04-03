import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { useOnboardingStore } from '../../stores/onboarding-store';
import type { OnboardingData } from '../../stores/onboarding-store';

type ActivityLevel = NonNullable<OnboardingData['activityLevel']>;

interface ActivityOption {
  value: ActivityLevel;
  emoji: string;
  title: string;
  subtitle: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'sedentary', emoji: '🛋️', title: 'Sedentary', subtitle: 'Little or no exercise, desk job' },
  { value: 'light', emoji: '🚶', title: 'Lightly Active', subtitle: 'Light exercise 1-3 days/week' },
  { value: 'moderate', emoji: '🏊', title: 'Moderately Active', subtitle: 'Moderate exercise 3-5 days/week' },
  { value: 'active', emoji: '🏋️', title: 'Very Active', subtitle: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', emoji: '🔥', title: 'Extremely Active', subtitle: 'Very hard exercise + physical job' },
];

export default function Step5Activity(): React.JSX.Element {
  const { colors } = useTheme();
  const setActivityLevel = useOnboardingStore((s) => s.setActivityLevel);
  const [selected, setSelected] = useState<ActivityLevel | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    setActivityLevel(selected);
    router.push('/(onboarding)/step6-suggestions');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step 5 of 5</Text>

        <Text style={[styles.title, { color: colors.text }]}>How active are you?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose the level that best matches your typical week.
        </Text>

        <View style={styles.options}>
          {ACTIVITY_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.cardEmoji}>{opt.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{opt.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={selected === null}
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
  options: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    padding: 18,
  },
  cardEmoji: {
    fontSize: 30,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
  button: {
    width: '100%',
  },
});
