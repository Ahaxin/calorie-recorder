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

type Sex = NonNullable<OnboardingData['sex']>;

interface SexOption {
  value: Sex;
  emoji: string;
  title: string;
}

const SEX_OPTIONS: SexOption[] = [
  { value: 'male', emoji: '♂', title: 'Male' },
  { value: 'female', emoji: '♀', title: 'Female' },
];

export default function Step2Sex(): React.JSX.Element {
  const { colors } = useTheme();
  const setSex = useOnboardingStore((s) => s.setSex);
  const [selected, setSelected] = useState<Sex | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    setSex(selected);
    router.push('/(onboarding)/step3-dob');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step 2 of 5</Text>

        <Text style={[styles.title, { color: colors.text }]}>What's your sex?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This is used to calculate your metabolic rate more accurately.
        </Text>

        <View style={styles.options}>
          {SEX_OPTIONS.map((opt) => {
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
                <Text style={[styles.cardTitle, { color: colors.text }]}>{opt.title}</Text>
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
    padding: 22,
    gap: 16,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
  button: {
    width: '100%',
  },
});
