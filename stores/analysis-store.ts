import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { analyzeFood, recalculateFoodItem } from '../lib/gemini';
import { uploadMealPhoto } from '../lib/storage';
import { USERS_COLLECTION, MEALS_SUBCOLLECTION } from '../lib/firebase';
import { FoodItem, MealCategory } from '../types/food';
import { AnalysisSession } from '../types/analysis';
import { format } from 'date-fns';

interface AnalysisActions {
  setPhoto: (uri: string, base64: string, mimeType: string) => void;
  setTextDescription: (text: string) => void;
  analyze: () => Promise<boolean>;
  reanalyze: (additionalText: string) => Promise<boolean>;
  updateFoodItem: (itemId: string, updates: Partial<FoodItem>) => void;
  recalculateItem: (itemId: string) => Promise<void>;
  setCategory: (category: MealCategory) => void;
  saveMeal: () => Promise<string>;
  reset: () => void;
}

const initialState: AnalysisSession = {
  photoUri: null,
  photoBase64: null,
  photoMimeType: 'image/jpeg',
  textDescription: '',
  result: null,
  foodItems: [],
  isAnalyzing: false,
  error: null,
  selectedCategory: 'lunch',
};

export const useAnalysisStore = create<AnalysisSession & AnalysisActions>(
  (set, get) => ({
    ...initialState,

    setPhoto: (uri, base64, mimeType) =>
      set({ photoUri: uri, photoBase64: base64, photoMimeType: mimeType, result: null, foodItems: [], error: null }),

    setTextDescription: (text) => set({ textDescription: text }),

    analyze: async () => {
      const { photoBase64, photoMimeType, textDescription } = get();
      if (!photoBase64) return false;
      set({ isAnalyzing: true, error: null });
      try {
        const result = await analyzeFood(photoBase64, photoMimeType, textDescription);
        const foodItems: FoodItem[] = result.foods.map((f) => ({
          id: uuidv4(),
          name: f.name,
          estimatedWeightGrams: f.estimatedWeightGrams,
          totalCalories: f.totalCalories,
          confidence: f.confidence,
          ingredients: f.ingredients,
          userModified: false,
        }));
        set({ result, foodItems, isAnalyzing: false });
        return true;
      } catch (e: unknown) {
set({ error: 'Failed to analyze food. Please try again.', isAnalyzing: false });
        return false;
      }
    },

    reanalyze: async (additionalText) => {
      const { photoBase64, photoMimeType, textDescription } = get();
      if (!photoBase64) return false;
      const combined = [textDescription, additionalText].filter(Boolean).join('. ');
      set({ textDescription: combined, isAnalyzing: true, error: null });
      try {
        const result = await analyzeFood(photoBase64, photoMimeType, combined);
        const foodItems: FoodItem[] = result.foods.map((f) => ({
          id: uuidv4(),
          name: f.name,
          estimatedWeightGrams: f.estimatedWeightGrams,
          totalCalories: f.totalCalories,
          confidence: f.confidence,
          ingredients: f.ingredients,
          userModified: false,
        }));
        set({ result, foodItems, isAnalyzing: false });
        return true;
      } catch {
        set({ error: 'Failed to analyze food. Please try again.', isAnalyzing: false });
        return false;
      }
    },

    updateFoodItem: (itemId, updates) =>
      set((state) => ({
        foodItems: state.foodItems.map((item) =>
          item.id === itemId ? { ...item, ...updates, userModified: true } : item
        ),
      })),

    recalculateItem: async (itemId) => {
      const item = get().foodItems.find((f) => f.id === itemId);
      if (!item) return;
      set({ isAnalyzing: true, error: null });
      try {
        const updated = await recalculateFoodItem(item);
        set((state) => ({
          foodItems: state.foodItems.map((f) =>
            f.id === itemId
              ? {
                  ...f,
                  totalCalories: updated.totalCalories,
                  ingredients: updated.ingredients,
                  userModified: true,
                }
              : f
          ),
          isAnalyzing: false,
        }));
      } catch {
        set({ error: 'Failed to recalculate. Please try again.', isAnalyzing: false });
      }
    },

    setCategory: (category) => set({ selectedCategory: category }),

    saveMeal: async () => {
      const { photoUri, foodItems, textDescription, selectedCategory } = get();
      const user = auth().currentUser;
      if (!user || !photoUri) throw new Error('Not authenticated or no photo');

      const mealId = uuidv4();
      const photoUrl = await uploadMealPhoto(user.uid, mealId, photoUri);
      const totalCalories = foodItems.reduce((sum, f) => sum + f.totalCalories, 0);
      const now = firestore.Timestamp.now();

      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .collection(MEALS_SUBCOLLECTION)
        .doc(mealId)
        .set({
          userId: user.uid,
          category: selectedCategory,
          photoUrl,
          textDescription: textDescription || null,
          foodItems,
          totalCalories,
          analyzedAt: now,
          savedAt: now,
          date: format(new Date(), 'yyyy-MM-dd'),
        });

      return mealId;
    },

    reset: () => set(initialState),
  })
);
