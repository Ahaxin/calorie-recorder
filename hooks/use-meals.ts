import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
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

    const unsubscribe = firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .collection(MEALS_SUBCOLLECTION)
      .where('date', '==', date)
      .orderBy('savedAt', 'asc')
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as MealEntry[];
          setMeals(data);
          setLoading(false);
        },
        () => setLoading(false)
      );

    return unsubscribe;
  }, [uid, date]);

  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  return { meals, totalCalories, loading };
}
