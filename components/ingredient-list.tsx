import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ingredient } from '../types/food';
import { COLORS } from '../lib/constants';

interface IngredientListProps {
  ingredients: Ingredient[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.col, styles.headerText]}>Ingredient</Text>
        <Text style={[styles.colRight, styles.headerText]}>Weight</Text>
        <Text style={[styles.colRight, styles.headerText]}>Calories</Text>
      </View>
      {ingredients.map((ing, i) => (
        <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
          <Text style={styles.col}>{ing.name}</Text>
          <Text style={styles.colRight}>{Math.round(ing.estimatedWeightGrams)}g</Text>
          <Text style={[styles.colRight, styles.calText]}>
            {Math.round(ing.calories)} kcal
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  rowAlt: {
    backgroundColor: COLORS.background,
  },
  col: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  colRight: {
    width: 70,
    textAlign: 'right',
    fontSize: 14,
    color: COLORS.text,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calText: {
    fontWeight: '500',
    color: COLORS.primary,
  },
});
