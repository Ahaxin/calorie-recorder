import { Timestamp } from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyCalorieTarget: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
