import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAnalysisStore } from '../../stores/analysis-store';
import { MealCategoryPicker } from '../../components/meal-category-picker';
import { MacroBar } from '../../components/macro-bar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { LoadingOverlay } from '../../components/ui/loading-overlay';
import { CONFIDENCE_THRESHOLD } from '../../lib/constants';
import { useTheme } from '../../lib/theme';
import { FoodItem, Ingredient } from '../../types/food';

// ---------------------------------------------------------------------------
// ExpandableFoodItem
// ---------------------------------------------------------------------------

interface ExpandableFoodItemProps {
  item: FoodItem;
  isExpanded: boolean;
  onToggle: () => void;
  onRecalculate: (itemId: string, updatedIngredients: Ingredient[]) => Promise<void>;
  isRecalculating: boolean;
}

function ExpandableFoodItem({
  item,
  isExpanded,
  onToggle,
  onRecalculate,
  isRecalculating,
}: ExpandableFoodItemProps): React.JSX.Element {
  const { colors } = useTheme();

  // Local editable weights, keyed by ingredient index
  const [editedWeights, setEditedWeights] = useState<Record<number, string>>(
    () => Object.fromEntries(item.ingredients.map((ing, i) => [i, String(ing.estimatedWeightGrams)]))
  );

  const isLowConfidence = item.confidence < CONFIDENCE_THRESHOLD;

  const handleWeightChange = (index: number, value: string): void => {
    setEditedWeights((prev) => ({ ...prev, [index]: value }));
  };

  const handleRecalculate = async (): Promise<void> => {
    const updatedIngredients: Ingredient[] = item.ingredients.map((ing, i) => ({
      ...ing,
      estimatedWeightGrams: parseFloat(editedWeights[i]) || ing.estimatedWeightGrams,
    }));
    await onRecalculate(item.id, updatedIngredients);
  };

  return (
    <View style={[expandStyles.card, { backgroundColor: colors.surface }]}>
      {/* Header row — always visible, toggles expand */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={expandStyles.header}
      >
        <View style={expandStyles.headerLeft}>
          <Text style={[expandStyles.name, { color: colors.text }]}>{item.name}</Text>
          {item.userModified && (
            <Text style={[expandStyles.modifiedBadge, { color: colors.secondary }]}>edited</Text>
          )}
        </View>
        <View style={expandStyles.headerRight}>
          <Text style={[expandStyles.calories, { color: colors.primary }]}>
            {Math.round(item.totalCalories)} kcal
          </Text>
          <Text style={[expandStyles.arrow, { color: colors.textSecondary }]}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Subtitle row */}
      <View style={expandStyles.subtitle}>
        <Text style={[expandStyles.weight, { color: colors.textSecondary }]}>
          {Math.round(item.estimatedWeightGrams)}g
        </Text>
        <View
          style={[
            expandStyles.badge,
            isLowConfidence
              ? { backgroundColor: colors.warning + '20' }
              : { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Text style={[expandStyles.badgeText, { color: colors.textSecondary }]}>
            {isLowConfidence ? `${item.confidence}% confidence` : 'Identified'}
          </Text>
        </View>
      </View>

      {/* Expanded ingredient list */}
      {isExpanded && (
        <View style={expandStyles.expanded}>
          {/* Table header */}
          <View style={expandStyles.tableHeader}>
            <Text style={[expandStyles.colIngredient, expandStyles.colHeaderText, { color: colors.textSecondary }]}>
              Ingredient
            </Text>
            <Text style={[expandStyles.colWeight, expandStyles.colHeaderText, { color: colors.textSecondary }]}>
              Weight (g)
            </Text>
            <Text style={[expandStyles.colCalories, expandStyles.colHeaderText, { color: colors.textSecondary }]}>
              kcal
            </Text>
          </View>

          {item.ingredients.map((ing, i) => (
            <View key={i} style={expandStyles.tableRow}>
              <Text style={[expandStyles.colIngredient, expandStyles.cellText, { color: colors.text }]}>
                {ing.name}
              </Text>
              <TextInput
                style={[
                  expandStyles.colWeight,
                  expandStyles.weightInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={editedWeights[i]}
                onChangeText={(v) => handleWeightChange(i, v)}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={[expandStyles.colCalories, expandStyles.cellText, { color: colors.text }]}>
                {Math.round(ing.calories)}
              </Text>
            </View>
          ))}

          <Button
            label="Recalibrate with AI"
            onPress={handleRecalculate}
            variant="secondary"
            loading={isRecalculating}
            disabled={isRecalculating}
            style={expandStyles.recalibrateBtn}
          />
        </View>
      )}
    </View>
  );
}

const expandStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  modifiedBadge: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weight: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  expanded: {
    marginTop: 4,
    gap: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  colHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cellText: {
    fontSize: 13,
  },
  colIngredient: {
    flex: 3,
    paddingRight: 4,
  },
  colWeight: {
    flex: 2,
    textAlign: 'center',
  },
  colCalories: {
    flex: 1.5,
    textAlign: 'right',
  },
  weightInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 13,
    textAlign: 'center',
    height: 30,
  },
  recalibrateBtn: {
    marginTop: 8,
  },
});

// ---------------------------------------------------------------------------
// AnalysisScreen
// ---------------------------------------------------------------------------

export default function AnalysisScreen(): React.JSX.Element | null {
  const {
    photoUri,
    foodItems,
    selectedCategory,
    isAnalyzing,
    error,
    reanalyze,
    setCategory,
    saveMeal,
    updateFoodItem,
    recalculateItem,
    reset,
  } = useAnalysisStore();
  const { colors } = useTheme();

  const [clarification, setClarification] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [recalculatingItemId, setRecalculatingItemId] = useState<string | null>(null);

  const hasLowConfidence = foodItems.some((f) => f.confidence < CONFIDENCE_THRESHOLD);
  const totalCalories = foodItems.reduce((sum, f) => sum + f.totalCalories, 0);

  const totalProtein = foodItems
    .flatMap((f) => f.ingredients)
    .reduce((s, i) => s + (i.protein ?? 0), 0);
  const totalCarbs = foodItems
    .flatMap((f) => f.ingredients)
    .reduce((s, i) => s + (i.carbs ?? 0), 0);
  const totalFat = foodItems
    .flatMap((f) => f.ingredients)
    .reduce((s, i) => s + (i.fat ?? 0), 0);

  const handleSave = async (): Promise<void> => {
    try {
      await saveMeal();
      router.replace('/(tabs)/history');
      reset();
    } catch {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const handleRetake = (): void => {
    reset();
    router.replace('/(tabs)');
  };

  const handleReanalyze = async (): Promise<void> => {
    await reanalyze(clarification);
    setClarification('');
  };

  const handleToggleItem = (itemId: string): void => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleRecalculate = async (
    itemId: string,
    updatedIngredients: Ingredient[]
  ): Promise<void> => {
    updateFoodItem(itemId, { ingredients: updatedIngredients });
    setRecalculatingItemId(itemId);
    await recalculateItem(itemId);
    setRecalculatingItemId(null);
  };

  if (!photoUri) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LoadingOverlay visible={isAnalyzing && recalculatingItemId !== null} message="Recalculating..." />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

        {/* Error banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {foodItems.length > 0 && (
          <>
            {/* Total calories row */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.totalCal, { color: colors.primary }]}>
                {Math.round(totalCalories)} kcal
              </Text>
            </View>

            {/* Macro bar */}
            <View style={[styles.macroContainer, { backgroundColor: colors.surface }]}>
              <MacroBar protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
            </View>

            {/* Expandable food item list */}
            <View style={styles.list}>
              {foodItems.map((item) => (
                <ExpandableFoodItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedItemId === item.id}
                  onToggle={() => handleToggleItem(item.id)}
                  onRecalculate={handleRecalculate}
                  isRecalculating={recalculatingItemId === item.id}
                />
              ))}
            </View>

            {/* Clarification box for low-confidence items */}
            {hasLowConfidence && (
              <View style={[styles.clarificationBox, { backgroundColor: colors.warning + '15' }]}>
                <Text style={[styles.clarificationTitle, { color: colors.text }]}>
                  Some items need clarification
                </Text>
                <Text style={[styles.clarificationSub, { color: colors.textSecondary }]}>
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

            {/* Meal category picker */}
            <MealCategoryPicker selected={selectedCategory} onSelect={setCategory} />

            {/* Save / Retake */}
            <View style={styles.actions}>
              <Button label="Save Meal" onPress={handleSave} style={{ flex: 1 }} />
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
  safe: { flex: 1 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: { fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalCal: {
    fontSize: 26,
    fontWeight: '700',
  },
  macroContainer: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  list: { gap: 10 },
  clarificationBox: {
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  clarificationTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  clarificationSub: {
    fontSize: 13,
  },
  actions: { flexDirection: 'row', gap: 12 },
});
