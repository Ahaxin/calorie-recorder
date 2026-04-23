import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './constants';

const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
});

export interface AiMessageContext {
  hour: number;
  hasMealsToday: boolean;
  streak: number;
  caloriesConsumed: number;
  calorieTarget: number;
}

function buildPrompt(ctx: AiMessageContext): string {
  const period =
    ctx.hour >= 5 && ctx.hour < 12 ? 'morning'
    : ctx.hour >= 12 && ctx.hour < 18 ? 'afternoon'
    : ctx.hour >= 18 && ctx.hour < 23 ? 'evening'
    : 'late night';

  const remaining = ctx.calorieTarget - ctx.caloriesConsumed;
  const calorieNote =
    ctx.caloriesConsumed === 0
      ? 'no calories logged yet today'
      : remaining > 0
        ? `${ctx.caloriesConsumed} of ${ctx.calorieTarget} kcal consumed (${remaining} remaining)`
        : `${ctx.caloriesConsumed} kcal consumed, slightly over the ${ctx.calorieTarget} kcal target`;

  const streakNote =
    ctx.streak > 0 ? `${ctx.streak}-day logging streak` : 'no active streak';

  const mealsNote = ctx.hasMealsToday ? 'has logged meals today' : 'no meals logged today';

  return `You are a friendly fitness coach in a calorie tracking app. Write ONE short motivational message (max 12 words) for the user's home screen.

Context:
- Time of day: ${period} (hour ${ctx.hour})
- Meals: ${mealsNote}
- Streak: ${streakNote}
- Calories: ${calorieNote}

Rules:
- Be specific to the context (mention streak, remaining calories, or time of day)
- Warm and encouraging, never guilt-tripping
- No hashtags, no quotes, no labels — just the message text
- Optionally include one relevant emoji at the end
- Maximum 12 words`;
}

export async function generateAiMessage(ctx: AiMessageContext): Promise<string> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: buildPrompt(ctx) }] }],
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}
