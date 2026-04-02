import React, { useState } from 'react';
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
import { COLORS } from '../../../lib/constants';

export default function FoodDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { foodItems, updateFoodItem, recalculateItem, isAnalyzing } = useAnalysisStore();
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

  if (!item) {
    router.back();
    return null;
  }

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
    <SafeAreaView style={styles.safe}>
      <LoadingOverlay visible={isAnalyzing} message="Recalculating..." />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.totalCal}>{Math.round(item.totalCalories)} kcal total</Text>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <IngredientList ingredients={item.ingredients} />

        <Text style={styles.sectionTitle}>Edit Weights (grams)</Text>
        <Text style={styles.hint}>
          Adjust the weight of each ingredient, then tap Recalculate.
        </Text>

        <View style={styles.editTable}>
          {item.ingredients.map((ing, i) => (
            <View key={i} style={styles.editRow}>
              <Text style={styles.ingName}>{ing.name}</Text>
              <TextInput
                style={styles.weightInput}
                value={weights[String(i)]}
                onChangeText={(v) => handleWeightChange(i, v)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.gLabel}>g</Text>
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
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, gap: 14, paddingBottom: 32 },
  foodName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  totalCal: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  hint: { fontSize: 13, color: COLORS.textSecondary },
  editTable: { gap: 8 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  ingName: { flex: 1, fontSize: 14, color: COLORS.text },
  weightInput: {
    width: 64,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text,
  },
  gLabel: { fontSize: 13, color: COLORS.textSecondary, width: 14 },
});
