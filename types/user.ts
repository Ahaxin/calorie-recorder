import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyCalorieTarget: number;
  theme?: 'light' | 'dark';
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  // Onboarding fields
  goal?: 'lose' | 'maintain' | 'gain';
  sex?: 'male' | 'female';
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  onboardingComplete?: boolean;
  dailyProteinTarget?: number;
  dailyCarbsTarget?: number;
  dailyFatTarget?: number;
  notificationsEnabled?: boolean;
  mealReminderTimes?: string[];
}
