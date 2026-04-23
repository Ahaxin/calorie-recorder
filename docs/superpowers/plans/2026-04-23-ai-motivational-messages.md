# AI Motivational Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded motivational strings with Gemini-generated, context-aware messages cached once per day via AsyncStorage.

**Architecture:** `lib/ai-messages.ts` handles the Gemini text-only prompt and returns a string. `hooks/use-motivational-message.ts` manages AsyncStorage cache, static fallback, and async state. `app/(tabs)/index.tsx` swaps its `useMemo` for the new hook.

**Tech Stack:** `@google/genai` (already installed), `@react-native-async-storage/async-storage` (to install), TypeScript strict mode, Expo SDK 54.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Install | — | `@react-native-async-storage/async-storage` |
| Create | `lib/ai-messages.ts` | Build Gemini prompt, call API, return trimmed string |
| Create | `hooks/use-motivational-message.ts` | AsyncStorage cache, static fallback, state management |
| Modify | `app/(tabs)/index.tsx:56-58` | Swap `useMemo` for `useMotivationalMessage` hook |

---

## Task 1: Install AsyncStorage

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
npx expo install @react-native-async-storage/async-storage
```

Expected output: package added to `package.json` dependencies.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors about `@react-native-async-storage/async-storage`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-native-async-storage/async-storage"
```

---

## Task 2: Create `lib/ai-messages.ts`

**Files:**
- Create: `lib/ai-messages.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/ai-messages.ts
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/ai-messages.ts
git commit -m "feat: add generateAiMessage to lib/ai-messages.ts"
```

---

## Task 3: Create `hooks/use-motivational-message.ts`

**Files:**
- Create: `hooks/use-motivational-message.ts`

- [ ] **Step 1: Create the file**

```typescript
// hooks/use-motivational-message.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { generateAiMessage, AiMessageContext } from '../lib/ai-messages';
import { getMotivationalMessage } from '../lib/messages';

function cacheKey(): string {
  return `motivational_message_${format(new Date(), 'yyyy-MM-dd')}`;
}

export function useMotivationalMessage(ctx: AiMessageContext): string {
  const [message, setMessage] = useState<string>(() =>
    getMotivationalMessage({
      hour: ctx.hour,
      hasMealsToday: ctx.hasMealsToday,
      streak: ctx.streak,
    })
  );

  useEffect(() => {
    const key = cacheKey();

    async function load() {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          setMessage(cached);
          return;
        }

        const ai = await generateAiMessage(ctx);
        setMessage(ai);
        await AsyncStorage.setItem(key, ai);
      } catch {
        // keep static fallback silently
      }
    }

    load();
  }, []);

  return message;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-motivational-message.ts
git commit -m "feat: add useMotivationalMessage hook with AsyncStorage cache"
```

---

## Task 4: Wire hook into `app/(tabs)/index.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Replace the import**

In `app/(tabs)/index.tsx`, remove the `getMotivationalMessage` import and add the hook import:

```typescript
// Remove this line:
import { getMotivationalMessage } from '../../lib/messages';

// Add this line:
import { useMotivationalMessage } from '../../hooks/use-motivational-message';
```

- [ ] **Step 2: Replace the useMemo call**

Find lines 56–58 in `app/(tabs)/index.tsx`:
```typescript
  const motivationalMessage = useMemo(
    () => getMotivationalMessage({ hour: new Date().getHours(), hasMealsToday, streak }),
    [hasMealsToday, streak]
  );
```

Replace with:
```typescript
  const motivationalMessage = useMotivationalMessage({
    hour: new Date().getHours(),
    hasMealsToday,
    streak,
    caloriesConsumed: consumed,
    calorieTarget: target,
  });
```

- [ ] **Step 3: Remove unused `useMemo` import if no longer used**

Check if `useMemo` is still used elsewhere in the file. If the only usage was the motivational message, remove it from the React import:

```typescript
// Before (if useMemo is now unused):
import React, { useMemo, useEffect } from 'react';

// After:
import React, { useEffect } from 'react';
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: wire useMotivationalMessage hook into main screen"
```

---

## Task 5: Build & validate on emulator

**Files:** None — validation only.

- [ ] **Step 1: Build the Android debug APK**

```bash
cd android && ./gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64 --build-cache
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: Install on emulator**

```bash
adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 3: Start Metro**

```bash
npx expo start --port 8081
```

- [ ] **Step 4: Forward port**

```bash
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

- [ ] **Step 5: Smoke test — AI message loads**

Open the app and navigate to the main (home) tab. Within a few seconds the motivational message should update from the static fallback to an AI-generated message that references context (time of day, streak, or calorie progress).

- [ ] **Step 6: Smoke test — cache works**

Kill and reopen the app. The same AI message from Step 5 should appear immediately (no flicker, no new Gemini call).

- [ ] **Step 7: Smoke test — fallback on failure**

Temporarily set `EXPO_PUBLIC_GEMINI_API_KEY=invalid` in `.env`, rebuild, and open the app. The static fallback message should show without any error UI.

Restore the real key after testing.

- [ ] **Step 8: Final commit**

If any minor fixes were made during smoke testing, commit them:

```bash
git add -A
git commit -m "fix: address smoke test findings for AI motivational messages"
```
