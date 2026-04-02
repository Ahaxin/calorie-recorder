import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAnalysisStore } from '../../stores/analysis-store';
import { FoodItemCard } from '../../components/food-item-card';
import { MealCategoryPicker } from '../../components/meal-category-picker';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { LoadingOverlay } from '../../components/ui/loading-overlay';
import { COLORS, CONFIDENCE_THRESHOLD } from '../../lib/constants';

export default function AnalysisScreen() {
  const {
    photoUri,
    foodItems,
    selectedCategory,
    isAnalyzing,
    error,
    reanalyze,
    setCategory,
    saveMeal,
    reset,
  } = useAnalysisStore();

  const [clarification, setClarification] = useState('');

  const hasLowConfidence = foodItems.some((f) => f.confidence < CONFIDENCE_THRESHOLD);
  const totalCalories = foodItems.reduce((sum, f) => sum + f.totalCalories, 0);

  const handleSave = async () => {
    try {
      await saveMeal();
      reset();
      router.replace('/(tabs)/history');
    } catch {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const handleRetake = () => {
    reset();
    router.back();
  };

  const handleReanalyze = async () => {
    await reanalyze(clarification);
    setClarification('');
  };

  useEffect(() => {
    if (!photoUri) router.back();
  }, [photoUri]);

  if (!photoUri) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <LoadingOverlay visible={isAnalyzing} message="Analyzing food..." />
      <ScrollView contentContainerStyle={styles.container}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {foodItems.length > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalCal}>{Math.round(totalCalories)} kcal</Text>
            </View>

            <View style={styles.list}>
              {foodItems.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/analysis/detail/${item.id}`)}
                />
              ))}
            </View>

            {hasLowConfidence && (
              <View style={styles.clarificationBox}>
                <Text style={styles.clarificationTitle}>
                  Some items need clarification
                </Text>
                <Text style={styles.clarificationSub}>
                  Describe the uncertain food items to improve accuracy
                </Text>
                <Input
                  value={clarification}
                  onChangeText={setClarification}
                  placeholder="e.g. the red sauce is tomato pasta"
                  multiline
                  numberOfLines={2}
                  containerStyle={{ marginTop: 8 }}
                />
                <Button
                  label="Re-analyze"
                  onPress={handleReanalyze}
                  variant="secondary"
                  disabled={!clarification.trim()}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}

            <MealCategoryPicker
              selected={selectedCategory}
              onSelect={setCategory}
            />

            <View style={styles.actions}>
              <Button
                label="Save Meal"
                onPress={handleSave}
                style={{ flex: 1 }}
              />
              <Button
                label="Retake"
                onPress={handleRetake}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  errorBanner: {
    backgroundColor: COLORS.danger + '15',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: COLORS.danger, fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  totalCal: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  list: { gap: 10 },
  clarificationBox: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  clarificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  clarificationSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actions: { flexDirection: 'row', gap: 12 },
});
