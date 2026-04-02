import { FoodItem, MealCategory } from './food';

export interface GeminiFood {
  name: string;
  estimatedWeightGrams: number;
  totalCalories: number;
  confidence: number;
  ingredients: Array<{
    name: string;
    estimatedWeightGrams: number;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
}

export interface GeminiResponse {
  foods: GeminiFood[];
}

export interface AnalysisSession {
  photoUri: string | null;
  photoBase64: string | null;
  photoMimeType: string;
  textDescription: string;
  result: GeminiResponse | null;
  foodItems: FoodItem[];
  isAnalyzing: boolean;
  error: string | null;
  selectedCategory: MealCategory;
}
