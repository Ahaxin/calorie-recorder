import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { format, subDays } from 'date-fns';
import { MealEntry } from '../types/food';
import { USERS_COLLECTION, MEALS_SUBCOLLECTION } from '../lib/firebase';

/**
 * Returns all meals for the current user on a given date (YYYY-MM-DD).
 * Live-updates via Firestore onSnapshot.
 */
export function useMealsByDate(date: string): {
  meals: MealEntry[];
  totalCalories: number;
  loading: boolean;
} {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .collection(MEALS_SUBCOLLECTION)
      .where('date', '==', date)
      .onSnapshot(
        (snap) => {
          const data = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as MealEntry)
            .sort((a, b) => {
              const aMs = (a.savedAt as any)?.toMillis?.() ?? 0;
              const bMs = (b.savedAt as any)?.toMillis?.() ?? 0;
              return aMs - bMs;
            });
          setMeals(data);
          setLoading(false);
        },
        (err) => {
          console.error('[useMealsByDate] snapshot error:', err);
          setMeals([]);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [uid, date]);

  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  return { meals, totalCalories, loading };
}

/**
 * Deletes a meal document for the current authenticated user.
 */
export async function deleteMeal(mealId: string): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  await firestore()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection(MEALS_SUBCOLLECTION)
    .doc(mealId)
    .delete();
}

/**
 * Returns all meals for the last `days` days, grouped by date string.
 * Live-updates via Firestore onSnapshot.
 */
export function useMealHistory(days = 30): {
  byDate: Record<string, MealEntry[]>;
  loading: boolean;
} {
  const [byDate, setByDate] = useState<Record<string, MealEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setByDate({});
      setLoading(false);
      return;
    }
    setLoading(true);

    const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');

    const unsubscribe = firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .collection(MEALS_SUBCOLLECTION)
      .where('date', '>=', startDate)
      .onSnapshot(
        (snap) => {
          const grouped: Record<string, MealEntry[]> = {};
          snap.docs.forEach((doc) => {
            const meal = { id: doc.id, ...doc.data() } as MealEntry;
            if (!grouped[meal.date]) {
              grouped[meal.date] = [];
            }
            grouped[meal.date].push(meal);
          });
          // Sort each day's meals by savedAt ascending
          Object.keys(grouped).forEach((date) => {
            grouped[date].sort((a, b) => {
              const aMs = (a.savedAt as any)?.toMillis?.() ?? 0;
              const bMs = (b.savedAt as any)?.toMillis?.() ?? 0;
              return aMs - bMs;
            });
          });
          setByDate(grouped);
          setLoading(false);
        },
        (err) => {
          console.error('[useMealHistory] snapshot error:', err);
          setByDate({});
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [uid, days]);

  return { byDate, loading };
}
