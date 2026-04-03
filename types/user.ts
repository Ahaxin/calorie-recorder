import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyCalorieTarget: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}
