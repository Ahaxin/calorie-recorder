# Calorie Recorder — AI-Powered Food Tracking App

A cross-platform mobile app (iOS & Android) that uses Google Gemini AI to analyze food photos and automatically estimate calories and nutritional information.

## What It Does

Take a photo of any meal → Gemini AI identifies the food, estimates portion weights, and breaks down calories and macros (protein, carbs, fat) per ingredient — all in seconds.

**Core features:**
- **AI food analysis**: Photo → structured nutrition data via `gemini-2.0-flash` with JSON schema output
- **Ingredient-level breakdown**: Each meal is decomposed into individual ingredients with weight and calorie estimates
- **Confidence scoring**: Low-confidence results (< 80%) prompt the user for clarification
- **Edit & recalculate**: Users can adjust portion weights and re-query Gemini for updated estimates
- **Daily tracking**: Calorie ring progress toward daily goal, meal history by date
- **Meal categorization**: Breakfast / Lunch / Dinner / Snack
- **Google Sign-In + Email auth**: Firebase Auth with Google OAuth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 52 (Expo Router) |
| AI | Google Gemini `gemini-2.0-flash` via `@google/genai` SDK |
| Backend | Firebase (Firestore, Auth, Storage) |
| State | Zustand |
| Language | TypeScript (strict mode) |

## AI Integration Details

The Gemini integration (`lib/gemini.ts`) uses **structured output** with a `responseSchema` to get typed JSON directly from the model — no parsing fragility. The prompt sends the food image along with a schema describing `FoodItem[]`, each containing:

```
name, estimatedWeightGrams, totalCalories, confidence (0-100),
ingredients[{ name, estimatedWeightGrams, calories, protein, carbs, fat }]
```

When users edit portion weights, the app sends the updated values back to Gemini for recalculation — keeping the AI in the loop for accuracy.

## AI Tools Used in Development

This project was built with [Claude Code](https://claude.ai/code) (Anthropic) as the primary development AI assistant, using the `claude-sonnet-4-6` model throughout the full development lifecycle — from architecture design and component scaffolding to debugging and code review.

## Project Structure

```
app/
  (auth)/         # Login, Register screens
  (tabs)/         # Home (daily summary), History, Profile
  analysis/       # AI results screen, ingredient detail
components/
  calorie-ring.tsx        # SVG circular progress
  food-item-card.tsx      # Per-meal card with AI results
  ingredient-list.tsx     # Expandable ingredient breakdown
  google-sign-in-button.tsx
lib/
  gemini.ts       # Gemini API client + prompt + schema
  firebase.ts     # Firebase initialization
  storage.ts      # Photo upload to Firebase Storage
stores/
  auth-store.ts       # Auth state (Zustand)
  analysis-store.ts   # Current analysis state (Zustand)
```

## Data Model

```ts
MealEntry {
  id, userId, date: "YYYY-MM-DD",
  category: "breakfast" | "lunch" | "dinner" | "snack",
  photoUrl: string,
  foodItems: FoodItem[],
  totalCalories: number,
  createdAt: Timestamp
}

FoodItem {
  name, estimatedWeightGrams, totalCalories,
  confidence: number,   // 0–100, from Gemini
  ingredients: Ingredient[],
  userModified: boolean
}
```

Stored in Firestore at `users/{uid}/meals/{mealId}`. Photos in Firebase Storage at `meals/{uid}/{mealId}.jpg`.

## Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in keys
cp .env.example .env

# Start Metro
npx expo start
```

Required environment variables:
```
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

## License

MIT
