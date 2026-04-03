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
import { Input } from '../../components/ui/input';
import { useOnboardingStore } from '../../stores/onboarding-store';

type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ftin';

export default function Step4Body(): React.JSX.Element {
  const { colors } = useTheme();
  const setWeight = useOnboardingStore((s) => s.setWeight);
  const setHeight = useOnboardingStore((s) => s.setHeight);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightValue, setWeightValue] = useState('');

  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCmValue, setHeightCmValue] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleContinue = (): void => {
    setError(null);

    // Validate and convert weight
    const rawWeight = parseFloat(weightValue);
    if (isNaN(rawWeight) || rawWeight <= 0) {
      setError('Please enter a valid weight.');
      return;
    }
    const weightKg = weightUnit === 'lbs' ? rawWeight * 0.453592 : rawWeight;
    if (weightKg < 20 || weightKg > 400) {
      setError('Please enter a realistic weight.');
      return;
    }

    // Validate and convert height
    let heightCm: number;
    if (heightUnit === 'cm') {
      heightCm = parseFloat(heightCmValue);
      if (isNaN(heightCm) || heightCm <= 0) {
        setError('Please enter a valid height.');
        return;
      }
    } else {
      const feet = parseFloat(heightFeet);
      const inches = parseFloat(heightInches || '0');
      if (isNaN(feet) || feet < 0) {
        setError('Please enter a valid height.');
        return;
      }
      heightCm = feet * 30.48 + inches * 2.54;
    }
    if (heightCm < 50 || heightCm > 300) {
      setError('Please enter a realistic height.');
      return;
    }

    setWeight(Math.round(weightKg * 10) / 10);
    setHeight(Math.round(heightCm * 10) / 10);
    router.push('/(onboarding)/step5-activity');
  };

  const canContinue =
    weightValue.length > 0 &&
    (heightUnit === 'cm' ? heightCmValue.length > 0 : heightFeet.length > 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step 4 of 5</Text>

        <Text style={[styles.title, { color: colors.text }]}>Your body measurements</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Used to calculate your BMR and healthy weight range.
        </Text>

        {/* Weight Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weight</Text>
            <View style={[styles.unitToggle, { backgroundColor: colors.background }]}>
              {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => setWeightUnit(unit)}
                  style={[
                    styles.unitChip,
                    weightUnit === unit && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      { color: weightUnit === unit ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Input
            value={weightValue}
            onChangeText={(v) => setWeightValue(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
          />
        </View>

        {/* Height Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Height</Text>
            <View style={[styles.unitToggle, { backgroundColor: colors.background }]}>
              {(['cm', 'ftin'] as HeightUnit[]).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => setHeightUnit(unit)}
                  style={[
                    styles.unitChip,
                    heightUnit === unit && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      { color: heightUnit === unit ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {unit === 'ftin' ? 'ft/in' : unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {heightUnit === 'cm' ? (
            <Input
              value={heightCmValue}
              onChangeText={(v) => setHeightCmValue(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
            />
          ) : (
            <View style={styles.feetRow}>
              <Input
                value={heightFeet}
                onChangeText={(v) => setHeightFeet(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="ft"
                maxLength={1}
                containerStyle={styles.feetInput}
              />
              <Input
                value={heightInches}
                onChangeText={(v) => setHeightInches(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="in"
                maxLength={4}
                containerStyle={styles.inchesInput}
              />
            </View>
          )}
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
    marginBottom: 24,
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 2,
    gap: 2,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  feetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feetInput: {
    flex: 1,
  },
  inchesInput: {
    flex: 1.5,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
  },
  button: {
    width: '100%',
  },
});
