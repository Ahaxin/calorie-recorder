# Calorie Recorder App

## Project Overview
A cross-platform (iOS & Android) calorie recording app built with React Native (Expo). Users photograph food, Google Gemini AI estimates calories from the image, and meals are saved with daily tracking against calorie goals.

## Tech Stack
- **Framework**: React Native with Expo SDK 52+ (Expo Router for file-based navigation)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Google Gemini (`gemini-2.0-flash` via `@google/genai` SDK)
- **State**: Zustand (two stores: auth-store, analysis-store)
- **Auth**: Email/password + Google Sign-In

## Project Structure
```
app/                    # Expo Router screens
  _layout.tsx           # Root layout with auth gate
  (auth)/               # login.tsx, register.tsx
  (tabs)/               # index.tsx (main), history.tsx, profile.tsx
  analysis/             # [id].tsx (results), detail/[itemId].tsx (ingredients)
components/
  ui/                   # Button, Card, Input, LoadingOverlay
  food-item-card.tsx
  ingredient-list.tsx
  calorie-ring.tsx      # SVG circular progress
  meal-category-picker.tsx
  daily-summary-card.tsx
hooks/                  # use-auth, use-camera, use-meals, use-analysis
lib/                    # firebase.ts, gemini.ts, storage.ts, constants.ts
stores/                 # auth-store.ts, analysis-store.ts
types/                  # food.ts, user.ts, analysis.ts
```

## Data Models
See `types/food.ts` for full types. Key structures:
- `MealEntry`: saved meal with category (breakfast/lunch/dinner/snack), photoUrl, foodItems[], totalCalories, date (YYYY-MM-DD)
- `FoodItem`: name, estimatedWeightGrams, totalCalories, confidence (0-100), ingredients[], userModified
- `Ingredient`: name, estimatedWeightGrams, calories, protein?, carbs?, fat?
- Firestore path: `users/{uid}/meals/{mealId}`

## Gemini Integration
- `lib/gemini.ts` — API client, prompt template, schema
- Uses structured output (`responseSchema`) to get typed JSON back
- Confidence < 80% → show clarification prompt to user
- User can edit weights → `recalculateItem()` sends back to Gemini
- API key: `EXPO_PUBLIC_GEMINI_API_KEY` in `.env`

## Firebase Config
- Firebase config values go in `.env` as `EXPO_PUBLIC_FIREBASE_*` vars
- Firestore security rules: users can only read/write their own data
- Storage: photos stored at `meals/{uid}/{mealId}.jpg`

## Key Conventions
- TypeScript strict mode
- Functional components only, hooks for logic
- Zustand stores for global state; `onSnapshot` hooks for Firestore reads
- Expo Router navigation: `router.push()` for new screens, `router.back()` for back
- Colors and theme constants in `lib/constants.ts`
- All dates stored as both Firestore `Timestamp` (for ordering) and `"YYYY-MM-DD"` string (for daily queries)

## Implementation Phases
The app is built in 7 phases. See plan at:
`C:\Users\Xin Chang\.claude\plans\prancy-frolicking-zebra.md`

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | pending | Project scaffolding & Auth |
| 2 | pending | Camera & Photo capture |
| 3 | pending | Gemini AI integration |
| 4 | pending | Data persistence (Firestore) |
| 5 | pending | History & Profile pages |
| 6 | pending | Edit & Recalculate flow |
| 7 | pending | Polish & Google Sign-In |

## Using Agents (Harness Engineering)
This project uses specialized agents for different concerns:
- `@architect` — Architecture decisions, data model changes, API design
- `@coder` — Feature implementation, bug fixes
- `@verifier` — Testing, validation, code review

## Environment Variables
Copy `.env.example` to `.env` and fill in values:
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
