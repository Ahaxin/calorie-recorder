import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { format, subDays, parseISO, isMonday, startOfWeek } from 'date-fns';
import { USERS_COLLECTION } from '../lib/firebase';
import { sendRewardNotification } from '../lib/notifications';

export interface RewardsDoc {
  streak: number;
  totalStars: number;
  weeklyCheatUsed: boolean;
  weeklyCheatResetDate: string; // ISO date of last Monday cheat was reset
  badges: string[];
  starsByDate: Record<string, boolean>;
}

const REWARDS_SUBCOLLECTION = 'rewards';
const REWARDS_DOC_ID = 'main';

const DEFAULT_REWARDS: RewardsDoc = {
  streak: 0,
  totalStars: 0,
  weeklyCheatUsed: false,
  weeklyCheatResetDate: '',
  badges: [],
  starsByDate: {},
};

interface RewardsStore {
  rewards: RewardsDoc | null;
  loading: boolean;
  loadRewards: () => (() => void);
  checkAndAwardStar: (date: string, totalCalories: number, target: number) => Promise<void>;
  useCheatDay: (date: string) => Promise<void>;
}

/** Returns the ISO date string (YYYY-MM-DD) of the most recent Monday. */
function getLastMonday(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = subDays(today, diff);
  return format(monday, 'yyyy-MM-dd');
}

/**
 * Counts consecutive days ending on endDate where starsByDate[date] === true.
 * Walks backwards day by day until it hits a gap.
 */
function calculateStreak(starsByDate: Record<string, boolean>, endDate: string): number {
  let streak = 0;
  let current = parseISO(endDate);
  while (true) {
    const key = format(current, 'yyyy-MM-dd');
    if (starsByDate[key] === true) {
      streak += 1;
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Checks whether all days in the month of `date` have stars.
 * Only checks up to `date` itself (not future days).
 */
function allDaysInMonthHaveStars(
  starsByDate: Record<string, boolean>,
  date: string
): boolean {
  const d = parseISO(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = d.getDate();
  const daysToCheck = Math.min(daysInMonth, todayDay);
  for (let day = 1; day <= daysToCheck; day++) {
    const key = format(new Date(year, month, day), 'yyyy-MM-dd');
    if (!starsByDate[key]) return false;
  }
  return true;
}

export const useRewardsStore = create<RewardsStore>((set, get) => ({
  rewards: null,
  loading: true,

  loadRewards: () => {
    const user = auth().currentUser;
    if (!user) {
      set({ rewards: null, loading: false });
      return () => {};
    }

    const docRef = firestore()
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .collection(REWARDS_SUBCOLLECTION)
      .doc(REWARDS_DOC_ID);

    const unsubscribe = docRef.onSnapshot(
      async (snap) => {
        if (snap.exists()) {
          set({ rewards: snap.data() as RewardsDoc, loading: false });
        } else {
          // Initialize default rewards document for first-time users
          try {
            await docRef.set(DEFAULT_REWARDS);
          } catch (e) {
            console.error('[loadRewards] failed to init rewards doc:', e);
          }
          set({ rewards: { ...DEFAULT_REWARDS }, loading: false });
        }
      },
      (err) => {
        console.error('[loadRewards] snapshot error:', err);
        set({ loading: false });
      }
    );

    return unsubscribe;
  },

  checkAndAwardStar: async (date, totalCalories, target) => {
    const user = auth().currentUser;
    if (!user) return;

    const current = get().rewards ?? { ...DEFAULT_REWARDS };

    // Already awarded for this date — no-op
    if (current.starsByDate[date] === true) return;

    // Only award if within calorie target
    if (totalCalories > target) return;

    const newStarsByDate = { ...current.starsByDate, [date]: true };
    const newTotalStars = current.totalStars + 1;
    const newStreak = calculateStreak(newStarsByDate, date);

    const newBadges = [...current.badges];

    // 7-day streak badge
    if (newStreak >= 7 && !newBadges.includes('7star')) {
      newBadges.push('7star');
    }

    // Monthly sun badge: e.g. 'sun_2024-04'
    const monthKey = `sun_${date.slice(0, 7)}`;
    if (!newBadges.includes(monthKey) && allDaysInMonthHaveStars(newStarsByDate, date)) {
      newBadges.push(monthKey);
    }

    const updated: RewardsDoc = {
      ...current,
      starsByDate: newStarsByDate,
      totalStars: newTotalStars,
      streak: newStreak,
      badges: newBadges,
    };

    set({ rewards: updated });

    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .collection(REWARDS_SUBCOLLECTION)
        .doc(REWARDS_DOC_ID)
        .set(updated, { merge: true });

      await sendRewardNotification(
        'Star Earned!',
        `Great job! You hit your calorie target for ${date}.`,
      );

      if (newStreak >= 7 && newBadges.includes('7star') && !current.badges.includes('7star')) {
        await sendRewardNotification(
          'Achievement Unlocked!',
          "7-Day Champion! You've maintained your goal for 7 days straight!",
        );
      }
    } catch (e) {
      console.error('[checkAndAwardStar] Firestore write failed:', e);
    }
  },

  useCheatDay: async (date) => {
    const user = auth().currentUser;
    if (!user) return;

    const current = get().rewards ?? { ...DEFAULT_REWARDS };

    // Check if we need to reset the cheat day (new week)
    const lastMonday = getLastMonday();
    const cheatShouldReset =
      !current.weeklyCheatResetDate || current.weeklyCheatResetDate < lastMonday;

    if (current.weeklyCheatUsed && !cheatShouldReset) {
      throw new Error('Cheat day already used this week');
    }

    // Award star for the date regardless of calories
    const newStarsByDate = { ...current.starsByDate, [date]: true };
    const prevStars = current.starsByDate[date] === true ? 0 : 1;
    const newTotalStars = current.totalStars + prevStars;
    const newStreak = calculateStreak(newStarsByDate, date);

    const newBadges = [...current.badges];

    if (newStreak >= 7 && !newBadges.includes('7star')) {
      newBadges.push('7star');
    }

    const monthKey = `sun_${date.slice(0, 7)}`;
    if (!newBadges.includes(monthKey) && allDaysInMonthHaveStars(newStarsByDate, date)) {
      newBadges.push(monthKey);
    }

    const updated: RewardsDoc = {
      ...current,
      starsByDate: newStarsByDate,
      totalStars: newTotalStars,
      streak: newStreak,
      badges: newBadges,
      weeklyCheatUsed: true,
      weeklyCheatResetDate: cheatShouldReset ? lastMonday : current.weeklyCheatResetDate,
    };

    set({ rewards: updated });

    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .collection(REWARDS_SUBCOLLECTION)
        .doc(REWARDS_DOC_ID)
        .set(updated, { merge: true });
    } catch (e) {
      console.error('[useCheatDay] Firestore write failed:', e);
      throw e;
    }
  },
}));
