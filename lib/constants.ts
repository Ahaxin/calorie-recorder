export const LIGHT_COLORS = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#FF9800',
  danger: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

export const DARK_COLORS = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#FF9800',
  danger: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  background: '#0F0F0F',
  surface: '#1C1C1E',
  text: '#F2F2F7',
  textSecondary: '#8E8E93',
  border: '#2C2C2E',
  disabled: '#48484A',
};

// Keep COLORS as an alias for backwards compatibility during migration
export const COLORS = LIGHT_COLORS;

export function getColors(isDark: boolean) {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const MEAL_CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_CATEGORY_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export const DEFAULT_CALORIE_TARGET = 2000;

/** Minimum confidence (0–100) for a food item to be auto-accepted */
export const CONFIDENCE_THRESHOLD = 80;

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const MAX_IMAGE_SIZE_MB = 4;
