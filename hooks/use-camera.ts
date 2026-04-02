import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type CameraResult = {
  uri: string;
  base64: string;
  mimeType: string;
};

export function useCamera() {
  const pickFromCamera = useCallback(async (): Promise<CameraResult | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return readImage(result.assets[0].uri);
  }, []);

  const pickFromGallery = useCallback(async (): Promise<CameraResult | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return readImage(result.assets[0].uri);
  }, []);

  return { pickFromCamera, pickFromGallery };
}

async function readImage(uri: string): Promise<CameraResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
  return { uri, base64, mimeType: 'image/jpeg' };
}
