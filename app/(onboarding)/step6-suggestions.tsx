import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { useOnboardingStore, calculateTargets } from '../../stores/onboarding-store';
import type { OnboardingData } from '../../stores/onboarding-store';
import {
  requestNotificationPermission,
  scheduleAllMealReminders,
  scheduleNutritionNudge,
  DEFAULT_MEAL_REMINDER_TIMES,
} from '../../lib/notifications';

const STEP = 50; // kcal per tap
const MIN_CALORIES = 1200;
const MAX_CALORIES = 4000;

function getSubtitle(goal: OnboardingData['goal']): string {
  switch (goal) {
    case 'lose': return "Here's your weight loss plan";
    case 'gain': return "Here's your muscle gain plan";
    default: return "Here's your maintenance plan";
  }
}

function computeMacros(calories: number) {
  const protein = Math.round((calories * 0.30) / 4);
  const carbs   = Math.round((calories * 0.45) / 4);
  const fat     = Math.round((calories * 0.25) / 9);
  const proteinPct = Math.round((protein * 4 / calories) * 100);
  const carbsPct   = Math.round((carbs   * 4 / calories) * 100);
  const fatPct     = Math.round((fat     * 9 / calories) * 100);
  return { protein, carbs, fat, proteinPct, carbsPct, fatPct };
}

function computeWeeks(
  weightKg: number | undefined,
  heightCm: number | undefined,
  goal: OnboardingData['goal'],
  customCalories: number,
  tdee: number,
): number {
  if (!weightKg || !heightCm || goal === 'maintain') return 0;
  const heightM = heightCm / 100;
  const targetWeight =
    goal === 'lose'
      ? Math.round(24.9 * heightM * heightM)
      : Math.round(18.5 * heightM * heightM);
  const weightDiff = Math.abs(weightKg - targetWeight);
  const deficitPerWeek = Math.abs(tdee - customCalories); // kcal/week deficit or surplus
  if (deficitPerWeek < 10) return 0;
  // 7700 kcal ≈ 1 kg of body fat
  const weeksPerKg = 7700 / (deficitPerWeek * 7);
  return Math.max(1, Math.round(weightDiff * weeksPerKg));
}

export default function Step6Suggestions(): React.JSX.Element {
  const { colors } = useTheme();
  const store = useOnboardingStore();
  const saveOnboarding = useOnboardingStore((s) => s.saveOnboarding);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseTargets = useMemo(() => calculateTargets({
    goal: store.goal,
    sex: store.sex,
    dateOfBirth: store.dateOfBirth,
    weightKg: store.weightKg,
    heightCm: store.heightCm,
    activityLevel: store.activityLevel,
  }), [store.goal, store.sex, store.dateOfBirth, store.weightKg, store.heightCm, store.activityLevel]);

  const [customCalories, setCustomCalories] = useState(baseTargets.dailyCalories);

  const macros = useMemo(() => computeMacros(customCalories), [customCalories]);
  const weeksToGoal = useMemo(
    () => computeWeeks(store.weightKg, store.heightCm, store.goal, customCalories, baseTargets.tdee ?? baseTargets.dailyCalories),
    [store.weightKg, store.heightCm, store.goal, customCalories, baseTargets],
  );

  const handleDecrease = () => setCustomCalories((c) => Math.max(MIN_CALORIES, c - STEP));
  const handleIncrease = () => setCustomCalories((c) => Math.min(MAX_CALORIES, c + STEP));
  const handleReset    = () => setCustomCalories(baseTargets.dailyCalories);

  const handleLetsGo = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await saveOnboarding(customCalories, macros.protein, macros.carbs, macros.fat);
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleAllMealReminders(DEFAULT_MEAL_REMINDER_TIMES);
          await scheduleNutritionNudge();
        }
      } catch { /* ignore notification errors */ }
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const isModified = customCalories !== baseTargets.dailyCalories;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Your Personal Plan 🎯</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getSubtitle(store.goal)}
        </Text>

        {/* Daily calories — editable */}
        <View style={[styles.calorieCard, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}>
          <Text style={[styles.calorieLabel, { color: colors.primary }]}>Daily Calorie Target</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={handleDecrease}
              disabled={customCalories <= MIN_CALORIES}
              style={[styles.stepBtn, { backgroundColor: colors.primary + '30', opacity: customCalories <= MIN_CALORIES ? 0.4 : 1 }]}
            >
              <Text style={[styles.stepBtnText, { color: colors.primary }]}>−</Text>
            </TouchableOpacity>

            <Text style={[styles.calorieValue, { color: colors.primary }]}>
              {customCalories.toLocaleString()}
            </Text>

            <TouchableOpacity
              onPress={handleIncrease}
              disabled={customCalories >= MAX_CALORIES}
              style={[styles.stepBtn, { backgroundColor: colors.primary + '30', opacity: customCalories >= MAX_CALORIES ? 0.4 : 1 }]}
            >
              <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.calorieSubtext, { color: colors.textSecondary }]}>kcal per day · tap −/+ to adjust by 50</Text>

          {isModified && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                Reset to recommended ({baseTargets.dailyCalories.toLocaleString()} kcal)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Healthy weight range */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Healthy weight for your height</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {baseTargets.healthyBMIWeightMin}–{baseTargets.healthyBMIWeightMax} kg
          </Text>
        </View>

        {/* Duration — recalculates live */}
        {store.goal !== 'maintain' && weeksToGoal > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Estimated time to reach your goal</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{weeksToGoal} weeks</Text>
            {isModified && (
              <Text style={[styles.recalcNote, { color: colors.textSecondary }]}>
                ↻ Recalculated based on your custom target
              </Text>
            )}
          </View>
        )}

        {/* Macro split — recalculates live */}
        <View style={[styles.macroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.macroTitle, { color: colors.text }]}>Daily Macros</Text>
          <View style={styles.macroRow}>
            <MacroItem label="Protein" grams={macros.protein} pct={macros.proteinPct} color="#EF5350" textColor={colors.text} secondaryColor={colors.textSecondary} />
            <MacroItem label="Carbs"   grams={macros.carbs}   pct={macros.carbsPct}   color="#FFA726" textColor={colors.text} secondaryColor={colors.textSecondary} />
            <MacroItem label="Fat"     grams={macros.fat}     pct={macros.fatPct}     color="#42A5F5" textColor={colors.text} secondaryColor={colors.textSecondary} />
          </View>
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        {saving ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving your plan…</Text>
          </View>
        ) : (
          <Button label="Let's Go! 🚀" onPress={handleLetsGo} style={styles.button} />
        )}
      </View>
    </SafeAreaView>
  );
}

interface MacroItemProps {
  label: string; grams: number; pct: number;
  color: string; textColor: string; secondaryColor: string;
}

function MacroItem({ label, grams, pct, color, textColor, secondaryColor }: MacroItemProps): React.JSX.Element {
  return (
    <View style={macroStyles.item}>
      <View style={[macroStyles.dot, { backgroundColor: color }]} />
      <Text style={[macroStyles.grams, { color: textColor }]}>{grams}g</Text>
      <Text style={[macroStyles.label, { color: secondaryColor }]}>{label}</Text>
      <Text style={[macroStyles.pct, { color: secondaryColor }]}>{pct}%</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  grams: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500' },
  pct: { fontSize: 11 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingBottom: 8 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  calorieCard: { borderWidth: 2, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  calorieLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 24, fontWeight: '600', lineHeight: 28 },
  calorieValue: { fontSize: 40, fontWeight: '800', minWidth: 140, textAlign: 'center' },
  calorieSubtext: { fontSize: 12, marginTop: 2 },
  resetBtn: { marginTop: 10 },
  resetText: { fontSize: 12, textDecorationLine: 'underline' },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  infoLabel: { fontSize: 13, marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '600' },
  recalcNote: { fontSize: 11, marginTop: 4 },
  macroCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  macroTitle: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  macroRow: { flexDirection: 'row' },
  errorText: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  footer: { padding: 24, paddingTop: 12 },
  button: { width: '100%' },
  savingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 50 },
  savingText: { fontSize: 15 },
});
