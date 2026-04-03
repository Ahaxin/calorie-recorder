import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FoodItem } from '../types/food';
import { CONFIDENCE_THRESHOLD } from '../lib/constants';
import { useTheme } from '../lib/theme';

interface FoodItemCardProps {
  item: FoodItem;
  onPress: () => void;
}

export function FoodItemCard({ item, onPress }: FoodItemCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const isLowConfidence = item.confidence < CONFIDENCE_THRESHOLD;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          {item.userModified && (
            <Text style={[styles.modified, { color: colors.secondary }]}>edited</Text>
          )}
        </View>
        <Text style={[styles.calories, { color: colors.primary }]}>
          {Math.round(item.totalCalories)} kcal
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.weight, { color: colors.textSecondary }]}>
          {Math.round(item.estimatedWeightGrams)}g
        </Text>
        <View
          style={[
            styles.badge,
            isLowConfidence
              ? { backgroundColor: colors.warning + '20' }
              : { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            {isLowConfidence ? `${item.confidence}% confidence` : 'Identified'}
          </Text>
        </View>
      </View>

      <Text style={[styles.tap, { color: colors.disabled }]}>Tap to view ingredients →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modified: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weight: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tap: {
    fontSize: 12,
  },
});
