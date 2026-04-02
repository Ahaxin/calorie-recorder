import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FoodItem } from '../types/food';
import { COLORS, CONFIDENCE_THRESHOLD } from '../lib/constants';

interface FoodItemCardProps {
  item: FoodItem;
  onPress: () => void;
}

export function FoodItemCard({ item, onPress }: FoodItemCardProps) {
  const isLowConfidence = item.confidence < CONFIDENCE_THRESHOLD;

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.userModified && <Text style={styles.modified}>edited</Text>}
        </View>
        <Text style={styles.calories}>{Math.round(item.totalCalories)} kcal</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.weight}>{Math.round(item.estimatedWeightGrams)}g</Text>
        <View style={[styles.badge, isLowConfidence ? styles.badgeWarning : styles.badgeGood]}>
          <Text style={styles.badgeText}>
            {isLowConfidence ? `${item.confidence}% confidence` : 'Identified'}
          </Text>
        </View>
      </View>

      <Text style={styles.tap}>Tap to view ingredients →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    flex: 1,
  },
  modified: {
    fontSize: 11,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weight: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeGood: {
    backgroundColor: COLORS.primary + '20',
  },
  badgeWarning: {
    backgroundColor: COLORS.warning + '20',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tap: {
    fontSize: 12,
    color: COLORS.disabled,
  },
});
