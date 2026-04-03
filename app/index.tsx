import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../lib/theme';

export default function Index(): React.JSX.Element {
  const { user, profile, loading } = useAuthStore();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // User is authenticated but profile hasn't loaded yet — keep showing spinner
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile.onboardingComplete) {
    return <Redirect href="/(onboarding)/step1-goal" />;
  }

  return <Redirect href="/(tabs)" />;
}
