import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { UserProfile } from '../types/user';
import { DEFAULT_CALORIE_TARGET } from '../lib/constants';
import { USERS_COLLECTION } from '../lib/firebase';

interface AuthState {
  user: ReturnType<typeof auth>['currentUser'];
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'dailyCalorieTarget'>>) => Promise<void>;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  clearError: () => set({ error: null }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await auth().signInWithEmailAndPassword(email, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      set({ error: getFirebaseErrorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { user } = await auth().createUserWithEmailAndPassword(email, password);
      await user.updateProfile({ displayName });

      const now = firestore.Timestamp.now();
      const profile: Omit<UserProfile, 'uid'> = {
        email,
        displayName,
        dailyCalorieTarget: DEFAULT_CALORIE_TARGET,
        createdAt: now,
        updatedAt: now,
      };
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .set(profile);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      set({ error: getFirebaseErrorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await auth().signOut();
    set({ user: null, profile: null });
    router.replace('/(auth)/login');
  },

  loadProfile: async () => {
    const user = auth().currentUser;
    if (!user) return;
    const doc = await firestore()
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .get();
    if (doc.exists()) {
      set({ profile: { uid: user.uid, ...doc.data() } as UserProfile });
    }
  },

  updateProfile: async (updates) => {
    const user = auth().currentUser;
    if (!user) return;
    const updatedAt = firestore.Timestamp.now();
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(user.uid)
      .update({ ...updates, updatedAt });
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates, updatedAt } : null,
    }));
  },
}));

function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/invalid-email': return 'Invalid email address.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
      default: return 'An error occurred. Please try again.';
    }
  }
  return 'An error occurred. Please try again.';
}
