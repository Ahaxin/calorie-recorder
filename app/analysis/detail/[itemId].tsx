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

  const [weights, setWeights] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        (item?.ingredients ?? []).map((ing, i) => [
          String(i),
          String(Math.round(ing.estimatedWeightGrams)),
        ])
      )
  );

  useEffect(() => {
    if (!item) router.back();
  }, [item]);

  if (!item) return null;

  const handleWeightChange = (index: number, value: string) => {
    setWeights((prev) => ({ ...prev, [String(index)]: value }));
  };

  const handleRecalculate = async () => {
    const updatedIngredients = item.ingredients.map((ing, i) => ({
      ...ing,
      estimatedWeightGrams: parseFloat(weights[String(i)]) || ing.estimatedWeightGrams,
    }));
    updateFoodItem(item.id, { ingredients: updatedIngredients });
    await recalculateItem(item.id);
    Alert.alert('Updated', 'Calories recalculated based on new weights.');
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

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Weights (grams)</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Adjust the weight of each ingredient, then tap Recalculate.
        </Text>

        <View style={styles.editTable}>
          {item.ingredients.map((ing, i) => (
            <View key={i} style={[styles.editRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.ingName, { color: colors.text }]}>{ing.name}</Text>
              <TextInput
                style={[
                  styles.weightInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={weights[String(i)]}
                onChangeText={(v) => handleWeightChange(i, v)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={[styles.gLabel, { color: colors.textSecondary }]}>g</Text>
            </View>
          ))}
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
  editTable: { gap: 8 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  ingName: { flex: 1, fontSize: 14 },
  weightInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  gLabel: { fontSize: 13, width: 14 },
});
