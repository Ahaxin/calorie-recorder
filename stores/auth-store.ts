import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
  googleSignIn: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'dailyCalorieTarget' | 'notificationsEnabled' | 'mealReminderTimes'>>) => Promise<void>;
  toggleTheme: () => Promise<void>;
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
      router.replace('/(onboarding)/step1-goal');
    } catch (e: unknown) {
      set({ error: getFirebaseErrorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },

  googleSignIn: async () => {
    set({ loading: true, error: null });
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      // User cancelled — silently bail out
      if (response.type === 'cancelled') {
        set({ loading: false });
        return;
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        set({ error: 'Google sign-in failed. Please try again.', loading: false });
        return;
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const { user } = await auth().signInWithCredential(googleCredential);

      // Detect new vs returning user via Firestore profile existence
      const docRef = firestore().collection(USERS_COLLECTION).doc(user.uid);
      const doc = await docRef.get();

      if (!doc.exists()) {
        // New user — create minimal profile, send to onboarding
        const now = firestore.Timestamp.now();
        const profile: Omit<UserProfile, 'uid'> = {
          email: user.email ?? '',
          displayName: user.displayName ?? 'User',
          dailyCalorieTarget: DEFAULT_CALORIE_TARGET,
          createdAt: now,
          updatedAt: now,
        };
        await docRef.set(profile);
        router.replace('/(onboarding)/step1-goal');
      } else {
        // Returning user — go straight to tabs
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      // Swallow "sign-in already in progress" silently
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === statusCodes.IN_PROGRESS
      ) {
        return;
      }
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
    if (!user) {
      set({ profile: null });
      return;
    }
    try {
      const doc = await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .get();

      if (doc.exists()) {
        set({ profile: { uid: user.uid, ...doc.data() } as UserProfile });
      } else {
        set({ profile: null });
      }
    } catch (e: unknown) {
      set({ profile: null, error: getFirebaseErrorMessage(e) });
    }
  },

  updateProfile: async (updates) => {
    const user = auth().currentUser;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const updatedAt = firestore.Timestamp.now();
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .update({ ...updates, updatedAt });
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates, updatedAt } : null,
      }));
    } catch (e: unknown) {
      set({ error: getFirebaseErrorMessage(e) });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  toggleTheme: async () => {
    const user = auth().currentUser;
    if (!user) return;
    const currentTheme = get().profile?.theme;
    const newTheme: 'light' | 'dark' = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(user.uid)
        .update({ theme: newTheme });
      set((state) => ({
        profile: state.profile ? { ...state.profile, theme: newTheme } : null,
      }));
    } catch (e: unknown) {
      set({ error: getFirebaseErrorMessage(e) });
    }
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
