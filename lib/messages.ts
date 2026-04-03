export interface MessageContext {
  hour: number;
  hasMealsToday: boolean;
  streak: number;
}

const MORNING_MESSAGES: readonly string[] = [
  "Rise and shine! Your breakfast isn't going to log itself.",
  'Good morning! Start the day right — your future self will thank you.',
  "Morning! Time to fuel up. Let's see what today's breakfast looks like 🍳",
  'Early bird gets the calorie count. What are you having?',
  'Good morning! A great day starts with a great meal — let\'s document it.',
];

const AFTERNOON_MESSAGES: readonly string[] = [
  'Lunchtime! The most important meal of the afternoon.',
  "Midday check-in! What's on the menu today?",
  "Afternoon hunger? Don't let it go unrecorded 📸",
  'Lunch o\'clock. Your stomach is ready, is your camera?',
  'Halfway through the day — keep the logging streak alive!',
];

const EVENING_MESSAGES: readonly string[] = [
  'Dinner time! End the day with a healthy snap.',
  'Evening! One last photo for the day?',
  'Almost done for today — snap your dinner and close the loop 🌙',
  'Dinner is served. Make sure it\'s logged too.',
  "Evening check-in! Let's wrap up today's meals nicely.",
];

const LATE_NIGHT_MESSAGES: readonly string[] = [
  'Still up? Late night snack? No judgment, just log it 🌚',
  'Night owl spotted. Snap it before you forget!',
  'Burning the midnight oil and the midnight calories?',
  "Late night treat? We won't tell anyone — but we will log it.",
];

const NO_MEALS_MESSAGES: readonly string[] = [
  "You haven't eaten yet today... or have you? 🤔",
  'Your stomach called — it wants to be documented.',
  'Zero meals logged today. Your body is judging you 👀',
  "First meal of the day! Let's get it on the record.",
  "No food logged yet. Don't let today be a mystery.",
];

const HAS_MEALS_MESSAGES: readonly string[] = [
  'Nice work today! Keep the streak going 💪',
  "You're doing great! Every meal counts.",
  "Already logged today — you're on a roll! 🔥",
  'Great progress! One more meal to go?',
  "You're crushing it. Keep those photos coming!",
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getStreakMessage(streak: number): string {
  const messages: string[] = [
    `🔥 ${streak} day streak! Don't break it now.`,
    `${streak} days strong! You're unstoppable.`,
    `${streak} days in a row — you're basically a professional now.`,
    `${streak} day streak active 🔥 Let's make it ${streak + 1}.`,
  ];
  return pickRandom(messages);
}

function getTimeBasedMessage(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return pickRandom(MORNING_MESSAGES);
  }
  if (hour >= 12 && hour < 18) {
    return pickRandom(AFTERNOON_MESSAGES);
  }
  if (hour >= 18 && hour < 23) {
    return pickRandom(EVENING_MESSAGES);
  }
  return pickRandom(LATE_NIGHT_MESSAGES);
}

export function getMotivationalMessage(ctx: MessageContext): string {
  const { hour, hasMealsToday, streak } = ctx;

  if (streak > 2 && Math.random() < 0.3) {
    return getStreakMessage(streak);
  }

  if (!hasMealsToday) {
    return pickRandom(NO_MEALS_MESSAGES);
  }

  if (hasMealsToday && Math.random() < 0.4) {
    return pickRandom(HAS_MEALS_MESSAGES);
  }

  return getTimeBasedMessage(hour);
}
