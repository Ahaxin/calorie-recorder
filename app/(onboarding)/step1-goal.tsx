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

type Goal = NonNullable<OnboardingData['goal']>;

interface GoalOption {
  value: Goal;
  emoji: string;
  title: string;
  subtitle: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose', emoji: '🏃', title: 'Lose Weight', subtitle: 'Burn fat and get leaner' },
  { value: 'maintain', emoji: '⚖️', title: 'Stay Fit', subtitle: 'Maintain my current weight' },
  { value: 'gain', emoji: '💪', title: 'Gain Muscle', subtitle: 'Build strength and mass' },
];

export default function Step1Goal(): React.JSX.Element {
  const { colors } = useTheme();
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const [selected, setSelected] = useState<Goal | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    setGoal(selected);
    router.push('/(onboarding)/step2-sex');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step 1 of 5</Text>

        <Text style={[styles.title, { color: colors.text }]}>What's your goal?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We'll personalise your daily calorie target based on this.
        </Text>

        <View style={styles.options}>
          {GOAL_OPTIONS.map((opt) => {
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
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
  button: {
    width: '100%',
  },
});
