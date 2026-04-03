import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useCamera } from '../../hooks/use-camera';
import { useAnalysisStore } from '../../stores/analysis-store';
import { useTheme } from '../../lib/theme';
import { getMotivationalMessage } from '../../lib/messages';
import { useRewardsStore } from '../../stores/rewards-store';

function CameraIcon({ size = 52, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="2.5" fill={color} opacity={0.92} />
      <Path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" fill={color} opacity={0.92} />
      <Circle cx="12" cy="14" r="3.5" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
      <Circle cx="12" cy="14" r="1.6" fill="rgba(0,0,0,0.15)" />
      <Circle cx="18.2" cy="9.8" r="0.9" fill="rgba(0,0,0,0.18)" />
    </Svg>
  );
}

export default function MainScreen(): React.JSX.Element {
  const { pickFromCamera, pickFromGallery } = useCamera();
  const { setPhoto, reset, photoUri } = useAnalysisStore();
  const { colors } = useTheme();
  const { rewards, loadRewards } = useRewardsStore();

  useEffect(() => {
    const unsubscribe = loadRewards();
    return unsubscribe;
  }, []);

  const streak = rewards?.streak ?? 0;
  const totalStars = rewards?.totalStars ?? 0;
  const rewardsLabel = streak > 0 ? `⭐ ${totalStars} · ${streak}🔥` : `⭐ ${totalStars}`;

  const motivationalMessage = useMemo(
    () => getMotivationalMessage({ hour: new Date().getHours(), hasMealsToday: false, streak: 0 }),
    []
  );

  const handleCamera = async (): Promise<void> => {
    const result = await pickFromCamera();
    if (result.status === 'permission_denied') {
      Alert.alert('Permission Required', 'Camera access is needed to take food photos.');
      return;
    }
    if (result.status === 'cancelled') return;
    reset();
    setPhoto(result.data.uri, result.data.base64, result.data.mimeType);
    router.push('/analysis/confirm');
  };

  const handleGallery = async (): Promise<void> => {
    const result = await pickFromGallery();
    if (result.status === 'permission_denied') {
      Alert.alert('Permission Required', 'Photo library access is needed to choose a food photo.');
      return;
    }
    if (result.status !== 'success') return;
    reset();
    setPhoto(result.data.uri, result.data.base64, result.data.mimeType);
    router.push('/analysis/confirm');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>📅 History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/rewards')} activeOpacity={0.7}>
          <Text style={[styles.headerRewards, { color: colors.textSecondary }]}>{rewardsLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Middle content */}
      <View style={styles.middle}>
        <Text style={[styles.motivationalText, { color: colors.textSecondary }]} numberOfLines={3}>
          {motivationalMessage}
        </Text>

        {/* Camera button */}
        <TouchableOpacity
          style={[styles.cameraButton, { backgroundColor: photoUri ? 'transparent' : colors.primary }]}
          onPress={handleCamera}
          activeOpacity={0.85}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoThumbnail} resizeMode="cover" />
          ) : (
            <CameraIcon size={56} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Gallery link */}
        <TouchableOpacity onPress={handleGallery} activeOpacity={0.7} style={styles.galleryLink}>
          <Text style={[styles.galleryLinkText, { color: colors.primary }]}>or choose from gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerButton: { paddingVertical: 6, paddingHorizontal: 4 },
  headerButtonText: { fontSize: 14, fontWeight: '500' },
  headerRewards: { fontSize: 18 },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  motivationalText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: '75%',
    lineHeight: 22,
    marginBottom: 36,
  },
  cameraButton: {
    width: 200,
    height: 200,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoThumbnail: { width: 200, height: 200 },
  galleryLink: { marginTop: 16, padding: 8 },
  galleryLinkText: { fontSize: 14 },
});
