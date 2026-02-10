import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { identifyCoin } from '../src/services/coinIdentifier';
import { useCollectionStore } from '../src/store/collectionStore';
import { createId } from '../src/utils/id';

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [savedCoinId, setSavedCoinId] = useState<string | null>(null);
  const addCoin = useCollectionStore((s) => s.addCoin);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: identifyCoin,
    onError: () => Alert.alert('Scan failed', 'Please try another photo.'),
  });

  const applyPickedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setImageUri(asset.uri);
    setImageBase64(asset.base64 ?? undefined);
    setMimeType(asset.mimeType ?? 'image/jpeg');
    setSavedCoinId(null);
    mutation.reset();
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to select a coin image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      applyPickedAsset(result.assets[0]);
    }
  };

  const captureWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow camera access to scan coins.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) {
      applyPickedAsset(result.assets[0]);
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    await mutation.mutateAsync({ imageUri, imageBase64, mimeType });
  };

  const save = () => {
    if (!imageUri || !mutation.data || savedCoinId) return;

    const coin = {
      id: createId(),
      createdAt: new Date().toISOString(),
      imageUri,
      ...mutation.data,
    };

    addCoin(coin);
    setSavedCoinId(coin.id);
    Alert.alert('Saved', 'Coin added to your collection.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>Tip: center the coin and use good lighting for better results.</Text>

      <View style={styles.row}>
        <View style={styles.buttonWrap}>
          <Button title="Open camera" onPress={captureWithCamera} />
        </View>
        <View style={styles.buttonWrap}>
          <Button title="Choose from gallery" onPress={pickFromGallery} />
        </View>
      </View>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <Text style={styles.hint}>No image selected yet.</Text>}

      <Button title={mutation.isPending ? 'Analyzing...' : 'Analyze coin'} onPress={analyze} disabled={!imageUri || mutation.isPending} />

      {mutation.isPending ? <Text style={styles.hint}>Analyzing image…</Text> : null}

      {mutation.data ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text>{mutation.data.country}</Text>
          <Text>{mutation.data.denomination}</Text>
          <Text>{mutation.data.year}</Text>
          <Text>
            {mutation.data.estimatedValueMin} - {mutation.data.estimatedValueMax} {mutation.data.currency}
          </Text>
          <Text>Confidence: {mutation.data.confidence}</Text>
          <Text style={styles.disclaimer}>Estimate only — not a professional appraisal.</Text>
          <View style={{ height: 12 }} />
          <Button title={savedCoinId ? 'Saved' : 'Save to collection'} onPress={save} disabled={!!savedCoinId} />

          {savedCoinId ? (
            <View style={{ marginTop: 12 }}>
              <Button
                title="Open saved coin"
                onPress={() => router.push({ pathname: '/coin/[id]', params: { id: savedCoinId } })}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonWrap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  hint: {
    color: '#6b7280',
  },
  result: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  disclaimer: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 12,
  },
});
