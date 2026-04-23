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
