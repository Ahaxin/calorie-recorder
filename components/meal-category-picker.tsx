import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MealCategory } from '../types/food';
import { MEAL_CATEGORIES, MEAL_CATEGORY_LABELS, MEAL_CATEGORY_ICONS } from '../lib/constants';
import { useTheme } from '../lib/theme';

interface MealCategoryPickerProps {
  selected: MealCategory;
  onSelect: (category: MealCategory) => void;
}

export function MealCategoryPicker({ selected, onSelect }: MealCategoryPickerProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Meal type</Text>
      <View style={styles.row}>
        {MEAL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.surface },
              selected === cat && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{MEAL_CATEGORY_ICONS[cat]}</Text>
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                selected === cat && { color: colors.primary },
              ]}
            >
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
  },
  icon: { fontSize: 16 },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
