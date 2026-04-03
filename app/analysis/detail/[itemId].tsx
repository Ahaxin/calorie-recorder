import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAnalysisStore } from '../../../stores/analysis-store';
import { IngredientList } from '../../../components/ingredient-list';
import { Button } from '../../../components/ui/button';
import { LoadingOverlay } from '../../../components/ui/loading-overlay';
import { useTheme } from '../../../lib/theme';

export default function FoodDetailScreen(): React.JSX.Element | null {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { foodItems, updateFoodItem, recalculateItem, isAnalyzing } = useAnalysisStore();
  const { colors } = useTheme();
  const item = foodItems.find((f) => f.id === itemId);

  const totalWeight = item
    ? item.ingredients.reduce((sum, ing) => sum + ing.estimatedWeightGrams, 0)
    : 0;

  const [weightInput, setWeightInput] = useState(String(Math.round(totalWeight)));

  useEffect(() => {
    if (!item) router.back();
  }, [item]);

  if (!item) return null;

  const handleRecalculate = async () => {
    const newTotal = parseFloat(weightInput);
    if (!newTotal || newTotal <= 0) {
      Alert.alert('Invalid', 'Please enter a valid weight.');
      return;
    }

    const ratio = newTotal / totalWeight;
    const scaledIngredients = item.ingredients.map((ing) => ({
      ...ing,
      estimatedWeightGrams: ing.estimatedWeightGrams * ratio,
      calories: ing.calories * ratio,
    }));

    updateFoodItem(item.id, { ingredients: scaledIngredients });
    await recalculateItem(item.id);
    Alert.alert('Updated', 'Calories recalculated based on new amount.');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LoadingOverlay visible={isAnalyzing} message="Recalculating..." />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.totalCal, { color: colors.primary }]}>
          {Math.round(item.totalCalories)} kcal total
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
        <IngredientList ingredients={item.ingredients} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Adjust Amount</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Change the total weight to recalculate calories proportionally.
        </Text>

        <View style={[styles.weightRow, { backgroundColor: colors.surface }]}>
          <Text style={[styles.weightLabel, { color: colors.text }]}>Total weight</Text>
          <TextInput
            style={[styles.weightInput, { borderColor: colors.border, color: colors.text }]}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={[styles.gLabel, { color: colors.textSecondary }]}>g</Text>
        </View>

        <Button
          label="Recalculate with AI"
          onPress={handleRecalculate}
          variant="secondary"
          style={{ marginTop: 8 }}
        />

        <Button
          label="Done"
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 14, paddingBottom: 32 },
  foodName: { fontSize: 22, fontWeight: '700' },
  totalCal: { fontSize: 16, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  hint: { fontSize: 13 },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  weightLabel: { flex: 1, fontSize: 15 },
  weightInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 15,
  },
  gLabel: { fontSize: 14, width: 14 },
});
