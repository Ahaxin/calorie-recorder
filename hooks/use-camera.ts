import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type CameraResult = {
  uri: string;
  base64: string;
  mimeType: string;
};

export type CameraPickResult =
  | { status: 'success'; data: CameraResult }
  | { status: 'permission_denied' }
  | { status: 'cancelled' };

export function useCamera() {
  const pickFromCamera = useCallback(async (): Promise<CameraPickResult> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return { status: 'permission_denied' };

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
    return { status: 'success', data: await readImage(result.assets[0]) };
  }, []);

  const pickFromGallery = useCallback(async (): Promise<CameraPickResult> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return { status: 'permission_denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
    return { status: 'success', data: await readImage(result.assets[0]) };
  }, []);

  return { pickFromCamera, pickFromGallery };
}

async function readImage(asset: ImagePicker.ImagePickerAsset): Promise<CameraResult> {
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: 'base64',
  });
  return { uri: asset.uri, base64, mimeType: asset.mimeType ?? 'image/jpeg' };
}
