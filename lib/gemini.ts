import { GoogleGenAI, Type } from '@google/genai';
import { GeminiResponse, GeminiFood } from '../types/analysis';
import { FoodItem } from '../types/food';
import { GEMINI_MODEL } from './constants';

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
});

const FOOD_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    foods: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the food dish' },
          estimatedWeightGrams: {
            type: Type.NUMBER,
            description: 'Estimated weight in grams',
          },
          totalCalories: {
            type: Type.NUMBER,
            description: 'Estimated total calories (kcal)',
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Confidence score 0–100',
          },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                estimatedWeightGrams: { type: Type.NUMBER },
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ['name', 'estimatedWeightGrams', 'calories'],
            },
          },
        },
        required: [
          'name',
          'estimatedWeightGrams',
          'totalCalories',
          'confidence',
          'ingredients',
        ],
      },
    },
  },
  required: ['foods'],
};

function buildAnalysisPrompt(userDescription?: string): string {
  let prompt = `You are a professional nutritionist analyzing a photo of food.

Identify every distinct food item visible in the image. For each item:
1. Name the dish or food item.
2. Estimate its weight in grams based on visual portion size (a dinner plate is ~25cm diameter as reference).
3. Estimate total calories (kcal).
4. Break down the major ingredients with their individual estimated weight and calorie contributions.
5. Provide a confidence score (0-100) for your identification. Use lower scores when:
   - The food is partially obscured or blurry
   - The dish could be multiple similar foods
   - The portion size is hard to estimate from the angle

Be conservative with calorie estimates — slightly overestimate rather than underestimate.
Include cooking oils, sauces, and dressings as separate ingredients when visible.`;

  if (userDescription?.trim()) {
    prompt += `\n\nThe user describes this food as: "${userDescription.trim()}"
Use this description to improve your identification accuracy.`;
  }

  return prompt;
}

function buildRecalculationPrompt(foodItem: FoodItem): string {
  return `A user modified the ingredients of "${foodItem.name}".
Recalculate the total calories and per-ingredient calories based on these updated weights:

${JSON.stringify(foodItem.ingredients, null, 2)}

Keep the same ingredient names. Only update calorie values based on the new weights.
Return a single food item (not an array) with the updated totalCalories and updated ingredient calories.`;
}

export async function analyzeFood(
  imageBase64: string,
  mimeType: string,
  userDescription?: string
): Promise<GeminiResponse> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildAnalysisPrompt(userDescription) },
          { inlineData: { data: imageBase64, mimeType } },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: FOOD_ANALYSIS_SCHEMA,
    },
  });

  return parseGeminiJson<GeminiResponse>(response.text);
}

const RECALC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    estimatedWeightGrams: { type: Type.NUMBER },
    totalCalories: { type: Type.NUMBER },
    confidence: { type: Type.NUMBER },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          estimatedWeightGrams: { type: Type.NUMBER },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
        },
        required: ['name', 'estimatedWeightGrams', 'calories'],
      },
    },
  },
  required: ['name', 'estimatedWeightGrams', 'totalCalories', 'confidence', 'ingredients'],
};

export async function recalculateFoodItem(
  foodItem: FoodItem
): Promise<GeminiFood> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: buildRecalculationPrompt(foodItem) }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RECALC_SCHEMA,
    },
  });

  return parseGeminiJson<GeminiFood>(response.text);
}

function parseGeminiJson<T>(rawText: string | undefined): T {
  if (!rawText?.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error('Gemini returned malformed JSON.');
  }
}
