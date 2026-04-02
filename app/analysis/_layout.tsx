import { Stack } from 'expo-router';
import { COLORS } from '../../lib/constants';

export default function AnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '600', color: COLORS.text },
      }}
    >
      <Stack.Screen name="current" options={{ title: 'Analysis Result' }} />
      <Stack.Screen name="detail/[itemId]" options={{ title: 'Ingredient Breakdown' }} />
    </Stack>
  );
}
