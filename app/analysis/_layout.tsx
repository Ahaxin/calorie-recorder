import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme';

export default function AnalysisLayout(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600', color: colors.text },
      }}
    >
      <Stack.Screen name="confirm" options={{ headerShown: false }} />
      <Stack.Screen name="current" options={{ title: 'Analysis Result' }} />
      <Stack.Screen name="detail/[itemId]" options={{ title: 'Ingredient Breakdown' }} />
    </Stack>
  );
}
