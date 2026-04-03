import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

export interface MacroBarProps {
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

const PROTEIN_COLOR = '#EF5350';
const CARBS_COLOR = '#FFA726';
const FAT_COLOR = '#42A5F5';

// Calorie conversions: protein 4 kcal/g, carbs 4 kcal/g, fat 9 kcal/g
function toCalories(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function MacroBar({ protein, carbs, fat }: MacroBarProps): React.JSX.Element | null {
  const { colors } = useTheme();

  if (protein === 0 && carbs === 0 && fat === 0) return null;

  const totalKcal = toCalories(protein, carbs, fat);
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;

  const proteinPct = totalKcal > 0 ? proteinKcal / totalKcal : 0;
  const carbsPct = totalKcal > 0 ? carbsKcal / totalKcal : 0;
  const fatPct = totalKcal > 0 ? fatKcal / totalKcal : 0;

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={[styles.label, { color: colors.text }]}>Nutrition</Text>
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          P {Math.round(protein)}g · C {Math.round(carbs)}g · F {Math.round(fat)}g
        </Text>
      </View>

      {/* Segmented bar */}
      <View style={styles.barRow}>
        {proteinPct > 0 && (
          <View
            style={[
              styles.barSegment,
              { flex: proteinPct, backgroundColor: PROTEIN_COLOR },
              styles.barLeft,
            ]}
          />
        )}
        {carbsPct > 0 && (
          <View
            style={[
              styles.barSegment,
              { flex: carbsPct, backgroundColor: CARBS_COLOR },
              proteinPct === 0 ? styles.barLeft : undefined,
            ]}
          />
        )}
        {fatPct > 0 && (
          <View
            style={[
              styles.barSegment,
              { flex: fatPct, backgroundColor: FAT_COLOR },
              styles.barRight,
              proteinPct === 0 && carbsPct === 0 ? styles.barLeft : undefined,
            ]}
          />
        )}
      </View>

      {/* Macro columns */}
      <View style={styles.macroColumns}>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: PROTEIN_COLOR }]} />
          <Text style={[styles.macroGrams, { color: colors.text }]}>
            {Math.round(protein)}g
          </Text>
          <Text style={[styles.macroName, { color: colors.textSecondary }]}>Protein</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: CARBS_COLOR }]} />
          <Text style={[styles.macroGrams, { color: colors.text }]}>
            {Math.round(carbs)}g
          </Text>
          <Text style={[styles.macroName, { color: colors.textSecondary }]}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: FAT_COLOR }]} />
          <Text style={[styles.macroGrams, { color: colors.text }]}>
            {Math.round(fat)}g
          </Text>
          <Text style={[styles.macroName, { color: colors.textSecondary }]}>Fat</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    fontSize: 12,
    fontWeight: '400',
  },
  barRow: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barSegment: {
    height: 10,
  },
  barLeft: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  barRight: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  macroColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroGrams: {
    fontSize: 14,
    fontWeight: '700',
  },
  macroName: {
    fontSize: 11,
    fontWeight: '400',
  },
});
