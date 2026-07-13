import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { Button, IconSymbol, Text } from '@/components';
import { isLocalUri, useSignedUrl, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { uploadToStorage } from '@/lib/upload';

interface Props {
  value?: string;
  onCaptured: (path: string) => void;
}

function photoPath() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
}

async function compressPhoto(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 800 });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: 0.78, format: SaveFormat.JPEG });
}

export function PhotoCaptureField({ value, onCaptured }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const previewUri = value && isLocalUri(value) ? value : undefined;
  const { data: signedPreviewUrl } = useSignedUrl(VISITOR_PHOTOS_BUCKET, previewUri ? undefined : value);
  const displayUri = previewUri ?? signedPreviewUrl;

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission required', 'Please grant camera access in your device settings to capture visitor photos.');
        return;
      }
    }
    setOpen(true);
  };

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (error) {
      Alert.alert('Capture failed', error instanceof Error ? error.message : 'Could not take photo. Please try again.');
    }
  };

  const accept = async () => {
    if (!capturedUri) return;
    setBusy(true);
    try {
      const compressed = await compressPhoto(capturedUri);
      const path = photoPath();
      await uploadToStorage('visitor-photos', compressed.uri, path);
      onCaptured(path);
      setOpen(false);
      setCapturedUri(undefined);
    } catch (error) {
      Alert.alert('Photo upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={openCamera} accessibilityRole="button" accessibilityLabel="Capture photo" android_ripple={{ color: 'rgba(249,112,102,0.15)' }}>
        <View className="min-h-[112px] items-center justify-center gap-sm rounded-lg border border-dashed border-coral bg-surface-secondary">
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={{ width: '100%', height: 160, borderRadius: 18 }} contentFit="cover" />
          ) : (
            <>
              <IconSymbol name="photo_camera" size={34} color="coral" />
              <Text variant="footnote" color="textSecondary">
                Tap to capture photo
              </Text>
            </>
          )}
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-text-primary">
          {capturedUri ? (
            <Image source={{ uri: capturedUri }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" animateShutter />
          )}

          <View className="absolute bottom-0 left-0 right-0 gap-md bg-text-primary/80 p-lg">
            {capturedUri ? (
              <View className="flex-row gap-md">
                <Button label="Retake" variant="outlined" full disabled={busy} onPress={() => setCapturedUri(undefined)} />
                <Button label="Use photo" full loading={busy} onPress={accept} />
              </View>
            ) : (
              <View className="flex-row gap-md">
                <Button label="Close" variant="outlined" full onPress={() => setOpen(false)} />
                <Button label="Capture" icon="photo_camera" full onPress={capture} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
