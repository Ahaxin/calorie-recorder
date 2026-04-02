import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../stores/auth-store';

/**
 * Subscribes to Firebase Auth state changes and syncs with the auth store.
 * Call this once at the root layout.
 */
export function useAuthListener(): void {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      useAuthStore.setState({ user, loading: false });
      if (user) {
        await store.loadProfile();
      } else {
        useAuthStore.setState({ profile: null });
      }
    });
    return unsubscribe;
  }, []);
}
