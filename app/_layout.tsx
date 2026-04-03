import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthListener } from '../hooks/use-auth';
import { ThemeProvider, useTheme } from '../lib/theme';
import { configureNotifications } from '../lib/notifications';

configureNotifications();

function AppContent(): React.JSX.Element {
  useAuthListener();
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="rewards" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
