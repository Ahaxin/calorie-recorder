import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useMealsByDate } from '../../hooks/use-meals';
import { useAuthStore } from '../../stores/auth-store';
import { CalorieRing } from '../../components/calorie-ring';
import { COLORS, MEAL_CATEGORY_ICONS, MEAL_CATEGORY_LABELS, DEFAULT_CALORIE_TARGET } from '../../lib/constants';
import { MealCategory } from '../../types/food';

export default function HistoryScreen() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { meals, totalCalories, loading } = useMealsByDate(date);
  const { profile } = useAuthStore();
  const target = profile?.dailyCalorieTarget ?? DEFAULT_CALORIE_TARGET;

  const categories: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Daily Log</Text>

        {/* Date Navigator */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            style={styles.navBtn}
          >
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {format(parseISO(date), 'EEE, MMM d yyyy')}
          </Text>
          <TouchableOpacity
            onPress={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            style={styles.navBtn}
          >
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringContainer}>
          <CalorieRing consumed={totalCalories} target={target} size={160} />
          <Text style={styles.ringLabel}>
            {totalCalories >= target
              ? `${Math.round(totalCalories - target)} kcal over`
              : `${Math.round(target - totalCalories)} kcal remaining`}
          </Text>
        </View>

        {/* Meals by category */}
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : meals.length === 0 ? (
          <Text style={styles.empty}>No meals recorded for this day.</Text>
        ) : (
          categories.map((cat) => {
            const catMeals = meals.filter((m) => m.category === cat);
            if (!catMeals.length) return null;
            return (
              <View key={cat} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {MEAL_CATEGORY_ICONS[cat]} {MEAL_CATEGORY_LABELS[cat]}
                </Text>
                {catMeals.map((meal) => (
                  <View key={meal.id} style={styles.mealCard}>
                    <Text style={styles.mealItems}>
                      {meal.foodItems.map((f) => f.name).join(', ')}
                    </Text>
                    <Text style={styles.mealCal}>{Math.round(meal.totalCalories)} kcal</Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 20, gap: 16 },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 22, color: COLORS.primary, fontWeight: '600' },
  dateText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  ringContainer: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  ringLabel: { fontSize: 13, color: COLORS.textSecondary },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mealItems: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  mealCal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 40,
  },
});
