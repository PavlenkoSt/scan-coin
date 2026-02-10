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
  const addCoin = useCollectionStore((s) => s.addCoin);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: identifyCoin,
    onError: () => Alert.alert('Scan failed', 'Please try another photo.'),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      mutation.reset();
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    await mutation.mutateAsync(imageUri);
  };

  const save = () => {
    if (!imageUri || !mutation.data) return;

    const coin = {
      id: createId(),
      createdAt: new Date().toISOString(),
      imageUri,
      ...mutation.data,
    };

    addCoin(coin);
    router.replace({ pathname: '/coin/[id]', params: { id: coin.id } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Pick coin image" onPress={pickImage} />

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}

      <Button title={mutation.isPending ? 'Analyzing...' : 'Analyze coin'} onPress={analyze} disabled={!imageUri || mutation.isPending} />

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
          <View style={{ height: 12 }} />
          <Button title="Save to collection" onPress={save} />
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
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#eee',
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
});
