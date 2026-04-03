import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAnalysisStore } from '../../stores/analysis-store';
import { useTheme } from '../../lib/theme';

const FOOD_EMOJIS = ['🍕', '🥗', '🍜', '🥩', '🍱', '🥦'];
const WAITING_MESSAGES = [
  'Consulting the calorie oracle...',
  'Counting every grain of rice...',
  'Asking the nutritionist AI...',
  'Scanning for hidden calories...',
  'Calculating your macros...',
  'Almost there, food detected!',
];

function WaitingScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const emojiTimer = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % FOOD_EMOJIS.length);
    }, 600);
    return () => clearInterval(emojiTimer);
  }, []);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  const dots = '.'.repeat(dotCount);

  return (
    <View style={[waitingStyles.container, { backgroundColor: colors.background }]}>
      <Animated.Text
        style={[waitingStyles.emoji, { transform: [{ scale: pulseAnim }] }]}
      >
        {FOOD_EMOJIS[emojiIndex]}
      </Animated.Text>
      <Text style={[waitingStyles.message, { color: colors.text }]}>
        {WAITING_MESSAGES[messageIndex]}
      </Text>
      <Text style={[waitingStyles.dots, { color: colors.textSecondary }]}>{dots}</Text>
    </View>
  );
}

const waitingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    fontSize: 28,
    letterSpacing: 4,
    height: 36,
  },
});

export default function ConfirmScreen(): React.JSX.Element {
  const { photoUri, isAnalyzing, error, setTextDescription, analyze, reset } =
    useAnalysisStore();
  const { colors } = useTheme();

  const [note, setNote] = useState('');

  useEffect(() => {
    if (!photoUri) {
      router.replace('/(tabs)');
    }
  }, [photoUri]);

  const handleAnalyze = async (): Promise<void> => {
    setTextDescription(note);
    const succeeded = await analyze();
    if (succeeded) {
      router.replace('/analysis/current');
    } else {
      const storeError = useAnalysisStore.getState().error;
      Alert.alert(
        'Analysis Failed',
        storeError ?? 'Failed to analyze food. Please try again.'
      );
    }
  };

  const handleRetake = (): void => {
    reset();
    router.replace('/(tabs)');
  };

  if (isAnalyzing) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <WaitingScreen />
      </SafeAreaView>
    );
  }

  if (!photoUri) {
    return <View style={[styles.safe, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Photo centered in remaining space with cute frame */}
        <View style={styles.photoArea}>
          <View style={[styles.frame, { borderColor: colors.primary, shadowColor: colors.primary }]}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Bottom panel — pinned to bottom */}
        <View style={[styles.bottomPanel, { backgroundColor: colors.surface }]}>
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <TextInput
            style={[
              styles.noteInput,
              { borderColor: colors.border, color: colors.text },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note... (optional)"
            placeholderTextColor={colors.disabled}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
            onPress={handleAnalyze}
            activeOpacity={0.85}
          >
            <Text style={styles.analyzeButtonText}>Analyze this meal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            activeOpacity={0.7}
          >
            <Text style={[styles.retakeText, { color: colors.textSecondary }]}>
              Retake
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  photoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  frame: {
    borderRadius: 20,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 4 / 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  bottomPanel: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    fontSize: 14,
    height: 44,
  },
  analyzeButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  retakeButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
