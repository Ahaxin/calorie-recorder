# AI-Generated Motivational Messages

**Date:** 2026-04-23
**Status:** Approved

## Overview

Replace the 30 hardcoded motivational strings in `lib/messages.ts` with Gemini-generated messages that are context-aware (time of day, streak, calorie progress). Static messages remain as instant fallbacks.

## Decisions

- **Frequency:** Once per day, cached in AsyncStorage keyed by date (`motivational_message_YYYY-MM-DD`)
- **Fallback:** Show static message from `lib/messages.ts` immediately; swap in AI message when ready. Silent failure keeps static fallback.
- **Context sent to Gemini:** `hour`, `hasMealsToday`, `streak`, `caloriesConsumed`, `calorieTarget`

## Architecture

```
index.tsx
  └─ useMotivationalMessage({ hour, hasMealsToday, streak, caloriesConsumed, calorieTarget })
       ├─ initialise with static fallback (synchronous, instant)
       ├─ on mount: check AsyncStorage for "motivational_message_YYYY-MM-DD"
       │    hit  → set cached message, done
       │    miss → call generateAiMessage() in background
       │                └─ lib/ai-messages.ts → Gemini API (text-only prompt)
       │                on success: update state + write AsyncStorage
       │                on failure: keep static fallback silently
       └─ returns: string (always)
```

## New Files

### `lib/ai-messages.ts`

Pure async function — no React.

```ts
export interface AiMessageContext {
  hour: number;
  hasMealsToday: boolean;
  streak: number;
  caloriesConsumed: number;
  calorieTarget: number;
}

export async function generateAiMessage(ctx: AiMessageContext): Promise<string>
```

Builds a text-only Gemini prompt instructing the model to return a single motivational message (max 12 words). Returns the trimmed `.text` string. Uses the existing `GoogleGenAI` client with `GEMINI_MODEL`.

**Prompt rules sent to Gemini:**
- Be specific to context (mention streak, remaining calories, or time of day)
- Warm and encouraging, never guilt-tripping
- No hashtags, quotes, or labels — just the message text
- One optional relevant emoji at the end
- Max 12 words

### `hooks/use-motivational-message.ts`

React hook — orchestrates cache, async call, state.

```ts
export function useMotivationalMessage(ctx: AiMessageContext): string
```

1. State initialised with `getMotivationalMessage({ hour, hasMealsToday: ctx.hasMealsToday, streak: ctx.streak })` (static, synchronous)
2. `useEffect` on mount: check AsyncStorage → cache hit returns immediately; cache miss fires `generateAiMessage(ctx)`, updates state and writes cache on success, does nothing on failure
3. Returns `message: string` — caller always has a string, never sees loading

## Modified Files

### `app/(tabs)/index.tsx`

Replace `useMemo` call:
```ts
// before
const motivationalMessage = useMemo(
  () => getMotivationalMessage({ hour: new Date().getHours(), hasMealsToday, streak }),
  [hasMealsToday, streak]
);

// after
const motivationalMessage = useMotivationalMessage({
  hour: new Date().getHours(),
  hasMealsToday,
  streak,
  caloriesConsumed: consumed,
  calorieTarget: target,
});
```

## `lib/messages.ts`

No changes — static messages remain as fallback pool.

## Error Handling

- Gemini API errors are caught silently; the static fallback persists
- No error UI is shown to the user — motivational message is non-critical
- AsyncStorage read/write errors are also caught silently

## Cache Behaviour

- Key format: `motivational_message_YYYY-MM-DD`
- One key per day; old keys are never explicitly deleted (trivial orphaned storage)
- Tomorrow's first open always triggers a fresh Gemini call

## Out of Scope

- No per-meal-log regeneration
- No loading indicator or skeleton for the message
- No server-side caching
