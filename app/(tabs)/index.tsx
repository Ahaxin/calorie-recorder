import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useCamera } from '../../hooks/use-camera';
import { useAnalysisStore } from '../../stores/analysis-store';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { COLORS } from '../../lib/constants';

export default function MainScreen() {
  const { pickFromCamera, pickFromGallery } = useCamera();
  const { setPhoto, setTextDescription, analyze, textDescription, photoUri, isAnalyzing, reset } =
    useAnalysisStore();
  const [localText, setLocalText] = useState('');

  const handleCamera = async () => {
    const result = await pickFromCamera();
    if (result.status === 'permission_denied') {
      Alert.alert('Permission Required', 'Camera access is needed to take food photos.');
      return;
    }
    if (result.status === 'cancelled') return;
    reset();
    setPhoto(result.data.uri, result.data.base64, result.data.mimeType);
    setLocalText('');
  };

  const handleGallery = async () => {
    const result = await pickFromGallery();
    if (result.status !== 'success') return;
    reset();
    setPhoto(result.data.uri, result.data.base64, result.data.mimeType);
    setLocalText('');
  };

  const handleAnalyze = async () => {
    setTextDescription(localText);
    const succeeded = await analyze();
    if (succeeded) {
      router.push('/analysis/current');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>What did you eat?</Text>
        <Text style={styles.subtitle}>Take a photo of your food to get calorie estimates</Text>

        <TouchableOpacity style={styles.cameraButton} onPress={handleCamera} activeOpacity={0.8}>
          {photoUri ? (
            <Text style={styles.cameraEmoji}>✅</Text>
          ) : (
            <Text style={styles.cameraEmoji}>📷</Text>
          )}
          <Text style={styles.cameraLabel}>
            {photoUri ? 'Photo taken – tap to retake' : 'Take a Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryButton} onPress={handleGallery} activeOpacity={0.8}>
          <Text style={styles.galleryText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <Input
          label="Describe your food (optional)"
          value={localText}
          onChangeText={setLocalText}
          placeholder="e.g. chicken rice with vegetables"
          multiline
          numberOfLines={2}
          containerStyle={{ marginTop: 20 }}
        />

        <Button
          label="Analyze Food"
          onPress={handleAnalyze}
          loading={isAnalyzing}
          disabled={!photoUri}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraEmoji: { fontSize: 52 },
  cameraLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  galleryButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
  },
  galleryText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '500',
  },
});
