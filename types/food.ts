import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  estimatedWeightGrams: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  estimatedWeightGrams: number;
  totalCalories: number;
  confidence: number; // 0-100
  ingredients: Ingredient[];
  userModified: boolean;
}

export interface MealEntry {
  id: string;
  userId: string;
  category: MealCategory;
  photoUrl: string;
  textDescription?: string;
  foodItems: FoodItem[];
  totalCalories: number;
  analyzedAt: FirebaseFirestoreTypes.Timestamp;
  savedAt: FirebaseFirestoreTypes.Timestamp;
  date: string; // "YYYY-MM-DD"
}
