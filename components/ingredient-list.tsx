import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ingredient } from '../types/food';
import { useTheme } from '../lib/theme';

interface IngredientListProps {
  ingredients: Ingredient[];
}

export function IngredientList({ ingredients }: IngredientListProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={[styles.headerRow, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[styles.col, styles.headerText, { color: colors.textSecondary }]}>Ingredient</Text>
        <Text style={[styles.colRight, styles.headerText, { color: colors.textSecondary }]}>Weight</Text>
        <Text style={[styles.colRight, styles.headerText, { color: colors.textSecondary }]}>Calories</Text>
      </View>
      {ingredients.map((ing, i) => (
        <View
          key={i}
          style={[
            styles.row,
            { backgroundColor: i % 2 === 0 ? colors.surface : colors.background },
          ]}
        >
          <Text style={[styles.col, { color: colors.text }]}>{ing.name}</Text>
          <Text style={[styles.colRight, { color: colors.text }]}>
            {Math.round(ing.estimatedWeightGrams)}g
          </Text>
          <Text style={[styles.colRight, styles.calText, { color: colors.primary }]}>
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
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  col: {
    flex: 1,
    fontSize: 14,
  },
  colRight: {
    width: 70,
    textAlign: 'right',
    fontSize: 14,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 13,
  },
  calText: {
    fontWeight: '500',
  },
});
