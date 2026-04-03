import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useMealHistory, deleteMeal } from '../../hooks/use-meals';
import { useAuthStore } from '../../stores/auth-store';
import { MacroBar } from '../../components/macro-bar';
import {
  MEAL_CATEGORY_ICONS,
  MEAL_CATEGORY_LABELS,
  DEFAULT_CALORIE_TARGET,
} from '../../lib/constants';
import { useTheme } from '../../lib/theme';
import { MealEntry, MealCategory } from '../../types/food';

const MEAL_CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
}

function computeMacros(meals: MealEntry[]): MacroTotals {
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const meal of meals) {
    for (const item of meal.foodItems) {
      for (const ing of item.ingredients) {
        protein += ing.protein ?? 0;
        carbs += ing.carbs ?? 0;
        fat += ing.fat ?? 0;
      }
    }
  }
  return { protein, carbs, fat };
}

function confirmDeleteMeal(meal: MealEntry): void {
  Alert.alert(
    'Delete meal?',
    'This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMeal(meal.id).catch((err: unknown) => {
            console.error('[history] deleteMeal error:', err);
          });
        },
      },
    ]
  );
}

export default function HistoryScreen(): React.JSX.Element {
  const { byDate, loading } = useMealHistory(30);
  const { profile } = useAuthStore();
  const { colors } = useTheme();
  const target = profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Dates sorted descending (newest first), only dates with meals
  const sortedDates = useMemo(
    () =>
      Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1)),
    [byDate]
  );

  // Today's entry is expanded by default; track expanded dates
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set([todayStr])
  );

  function toggleDate(date: string): void {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  const todayMeals = byDate[todayStr] ?? [];
  const todayMacros = useMemo(() => computeMacros(todayMeals), [todayMeals]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Daily Log</Text>
          <View style={styles.headerSide} />
        </View>

        {/* Today's macro summary */}
        {todayMeals.length > 0 && (
          <View style={[styles.macroCard, { backgroundColor: colors.surface }]}>
            <MacroBar
              protein={todayMacros.protein}
              carbs={todayMacros.carbs}
              fat={todayMacros.fat}
            />
          </View>
        )}

        {/* Body */}
        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading...</Text>
        ) : sortedDates.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {'No meals recorded yet.\nStart by capturing your first meal! 📸'}
          </Text>
        ) : (
          <View style={styles.dayList}>
            {sortedDates.map((date) => {
              const meals = byDate[date];
              const actualCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
              const isToday = date === todayStr;
              const isExpanded = expandedDates.has(date);
              const isUnder = actualCalories <= target;
              const calorieColor = isUnder ? colors.success : colors.danger;
              const dateLabel = format(parseISO(date), 'EEE, MMM d');

              return (
                <View
                  key={date}
                  style={[
                    styles.dayCard,
                    { backgroundColor: colors.surface },
                    isToday && {
                      borderLeftWidth: 3,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  {/* Day header row — tappable */}
                  <TouchableOpacity
                    onPress={() => toggleDate(date)}
                    style={styles.dayHeader}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: colors.text },
                        isToday && styles.dayLabelBold,
                      ]}
                    >
                      {dateLabel}
                    </Text>
                    <View style={styles.dayHeaderRight}>
                      <Text style={[styles.calorieText, { color: calorieColor }]}>
                        {Math.round(actualCalories).toLocaleString()} /{' '}
                        {target.toLocaleString()} kcal
                      </Text>
                      {isUnder && (
                        <Text style={styles.starIcon}> ⭐</Text>
                      )}
                      <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                        {isExpanded ? ' ▾' : ' ›'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded meal list */}
                  {isExpanded && (
                    <View style={styles.mealsContainer}>
                      {MEAL_CATEGORIES.map((cat) => {
                        const catMeals = meals.filter((m) => m.category === cat);
                        if (catMeals.length === 0) return null;
                        return (
                          <View key={cat} style={styles.categorySection}>
                            <Text
                              style={[styles.categoryLabel, { color: colors.textSecondary }]}
                            >
                              {MEAL_CATEGORY_ICONS[cat]} {MEAL_CATEGORY_LABELS[cat]}
                            </Text>
                            {catMeals.map((meal) => (
                              <View
                                key={meal.id}
                                style={[
                                  styles.mealCard,
                                  { backgroundColor: colors.background },
                                ]}
                              >
                                <View style={styles.mealInfo}>
                                  <Text
                                    style={[styles.mealItems, { color: colors.text }]}
                                    numberOfLines={2}
                                  >
                                    {meal.foodItems.map((f) => f.name).join(', ')}
                                  </Text>
                                  <Text
                                    style={[styles.mealCal, { color: colors.primary }]}
                                  >
                                    {Math.round(meal.totalCalories)} kcal
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => confirmDeleteMeal(meal)}
                                  style={styles.deleteBtn}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Text style={styles.deleteIcon}>🗑</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 60,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  macroCard: {
    borderRadius: 12,
    padding: 14,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 40,
    lineHeight: 24,
  },
  dayList: {
    gap: 10,
  },
  dayCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  dayLabelBold: {
    fontWeight: '700',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 13,
    fontWeight: '600',
  },
  starIcon: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealsContainer: {
    paddingLeft: 12,
    paddingRight: 14,
    paddingBottom: 12,
    gap: 10,
  },
  categorySection: {
    gap: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealCard: {
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealItems: {
    fontSize: 14,
  },
  mealCal: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingLeft: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
});
