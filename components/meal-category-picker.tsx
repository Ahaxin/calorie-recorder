import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MealCategory } from '../types/food';
import { COLORS, MEAL_CATEGORIES, MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ICONS } from '../lib/constants';

interface MealCategoryPickerProps {
  selected: MealCategory;
  onSelect: (category: MealCategory) => void;
}

export function MealCategoryPicker({ selected, onSelect }: MealCategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Meal type</Text>
      <View style={styles.row}>
        {MEAL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[styles.chip, selected === cat && styles.chipSelected]}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{MEAL_CATEGORY_ICONS[cat]}</Text>
            <Text style={[styles.chipText, selected === cat && styles.chipTextSelected]}>
              {MEAL_CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  icon: { fontSize: 16 },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },
});
