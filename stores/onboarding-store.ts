import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { USERS_COLLECTION } from '../lib/firebase';

export interface OnboardingData {
  goal?: 'lose' | 'maintain' | 'gain';
  sex?: 'male' | 'female';
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface CalculatedTargets {
  dailyCalories: number;
  tdee: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  healthyBMIWeightMin: number;
  healthyBMIWeightMax: number;
  weeklyWeightChangeKg: number;
  weeksToGoal: number;
}

export function calculateTargets(data: OnboardingData): CalculatedTargets {
  const { weightKg = 70, heightCm = 170, sex = 'male', goal = 'maintain', dateOfBirth, activityLevel = 'moderate' } = data;

  // Compute age from dateOfBirth
  let age = 30;
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasBirthdayPassed) {
      age -= 1;
    }
  }

  // BMR using Mifflin-St Jeor
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityMultipliers: Record<NonNullable<OnboardingData['activityLevel']>, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[activityLevel];

  let dailyCalories: number;
  switch (goal) {
    case 'lose':
      dailyCalories = Math.round(tdee - 500);
      break;
    case 'gain':
      dailyCalories = Math.round(tdee + 300);
      break;
    default:
      dailyCalories = Math.round(tdee);
  }

  const dailyProteinTarget = Math.round((dailyCalories * 0.30) / 4);
  const dailyCarbsTarget = Math.round((dailyCalories * 0.45) / 4);
  const dailyFatTarget = Math.round((dailyCalories * 0.25) / 9);

  const heightM = heightCm / 100;
  const healthyBMIWeightMin = Math.round(18.5 * heightM * heightM);
  const healthyBMIWeightMax = Math.round(24.9 * heightM * heightM);

  const weeklyWeightChangeKg =
    goal === 'lose' ? -0.5 : goal === 'gain' ? 0.3 : 0;

  let weeksToGoal = 0;
  if (goal !== 'maintain') {
    const targetWeight =
      goal === 'lose' ? healthyBMIWeightMax : healthyBMIWeightMin;
    const weightDiff = Math.abs(weightKg - targetWeight);
    if (weightDiff > 0 && weeklyWeightChangeKg !== 0) {
      weeksToGoal = Math.round(weightDiff / Math.abs(weeklyWeightChangeKg));
    }
  }

  return {
    dailyCalories,
    tdee: Math.round(tdee),
    dailyProteinTarget,
    dailyCarbsTarget,
    dailyFatTarget,
    healthyBMIWeightMin,
    healthyBMIWeightMax,
    weeklyWeightChangeKg,
    weeksToGoal,
  };
}

interface OnboardingStore extends OnboardingData {
  setGoal: (goal: OnboardingData['goal']) => void;
  setSex: (sex: OnboardingData['sex']) => void;
  setDateOfBirth: (dob: string) => void;
  setWeight: (kg: number) => void;
  setHeight: (cm: number) => void;
  setActivityLevel: (level: OnboardingData['activityLevel']) => void;
  saveOnboarding: (
    dailyCalorieTarget: number,
    dailyProteinTarget: number,
    dailyCarbsTarget: number,
    dailyFatTarget: number,
  ) => Promise<void>;
  reset: () => void;
}

const initialState: OnboardingData = {
  goal: undefined,
  sex: undefined,
  dateOfBirth: undefined,
  weightKg: undefined,
  heightCm: undefined,
  activityLevel: undefined,
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialState,

  setGoal: (goal) => set({ goal }),
  setSex: (sex) => set({ sex }),
  setDateOfBirth: (dob) => set({ dateOfBirth: dob }),
  setWeight: (kg) => set({ weightKg: kg }),
  setHeight: (cm) => set({ heightCm: cm }),
  setActivityLevel: (level) => set({ activityLevel: level }),

  saveOnboarding: async (dailyCalorieTarget, dailyProteinTarget, dailyCarbsTarget, dailyFatTarget) => {
    const user = auth().currentUser;
    if (!user) throw new Error('No authenticated user');

    const { goal, sex, dateOfBirth, weightKg, heightCm, activityLevel } = get();
    const updatedAt = firestore.Timestamp.now();

    await firestore()
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .update({
        goal,
        sex,
        dateOfBirth,
        weightKg,
        heightCm,
        activityLevel,
        dailyCalorieTarget,
        dailyProteinTarget,
        dailyCarbsTarget,
        dailyFatTarget,
        onboardingComplete: true,
        updatedAt,
      });

    set({ ...initialState });
  },

  reset: () => set({ ...initialState }),
}));
