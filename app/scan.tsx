import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { identifyCoin } from '../src/services/coinIdentifier';
import { useCollectionStore } from '../src/store/collectionStore';
import { createId } from '../src/utils/id';

type CoinSide = 'obverse' | 'reverse';

type SideImage = {
  uri: string;
  base64?: string;
  mimeType?: string;
};

const TARGET_WIDTH = 1200;
const COMPRESS = 0.6;

async function optimizeImage(asset: ImagePicker.ImagePickerAsset): Promise<SideImage> {
  const sourceUri = asset.uri;
  const width = asset.width ?? TARGET_WIDTH;
  const shouldResize = width > TARGET_WIDTH;

  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    shouldResize ? [{ resize: { width: TARGET_WIDTH } }] : [],
    {
      compress: COMPRESS,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  return {
    uri: manipulated.uri,
    base64: manipulated.base64 ?? undefined,
    mimeType: 'image/jpeg',
  };
}

export default function ScanScreen() {
  const [obverse, setObverse] = useState<SideImage | null>(null);
  const [reverse, setReverse] = useState<SideImage | null>(null);
  const [savedCoinId, setSavedCoinId] = useState<string | null>(null);
  const addCoin = useCollectionStore((s) => s.addCoin);
  const router = useRouter();
  const resultAnim = useRef(new Animated.Value(0)).current;

  const mutation = useMutation({
    mutationFn: identifyCoin,
    onMutate: async () => {
      await Haptics.selectionAsync();
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: async (error: any) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = String(error?.message || '');
      if (message.includes('(413)')) {
        Alert.alert('Image too large', 'Please retake with better framing or use lower resolution image.');
        return;
      }
      Alert.alert('Scan failed', 'Please try another photo.');
    },
  });

  useEffect(() => {
    if (mutation.data) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 70,
      }).start();
    }
  }, [mutation.data, resultAnim]);

  const applyPickedAsset = async (side: CoinSide, asset: ImagePicker.ImagePickerAsset) => {
    const payload = await optimizeImage(asset);

    if (side === 'obverse') setObverse(payload);
    else setReverse(payload);

    await Haptics.selectionAsync();
    setSavedCoinId(null);
    mutation.reset();
  };

  const pickFromGallery = async (side: CoinSide) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to select a coin image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: COMPRESS,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) await applyPickedAsset(side, result.assets[0]);
  };

  const captureWithCamera = async (side: CoinSide) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow camera access to scan coins.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: COMPRESS,
      base64: false,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) await applyPickedAsset(side, result.assets[0]);
  };

  const analyze = async () => {
    if (!obverse) {
      Alert.alert('Obverse required', 'Please capture or select the front side first.');
      return;
    }

    await mutation.mutateAsync({
      obverse: {
        imageUri: obverse.uri,
        imageBase64: obverse.base64,
        mimeType: obverse.mimeType,
      },
      reverse: reverse
        ? {
            imageUri: reverse.uri,
            imageBase64: reverse.base64,
            mimeType: reverse.mimeType,
          }
        : undefined,
    });
  };

  const save = async () => {
    if (!obverse || !mutation.data || savedCoinId) return;

    const coin = {
      id: createId(),
      createdAt: new Date().toISOString(),
      imageUri: obverse.uri,
      ...mutation.data,
    };

    addCoin(coin);
    setSavedCoinId(coin.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Coin added to your collection.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Scan</Text>
      <Text style={styles.hint}>Capture both sides in good lighting for better identification.</Text>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Front (Obverse) — required</Text>
        <View style={styles.row}>
          <View style={styles.buttonWrap}>
            <Button title="Camera (front)" onPress={() => captureWithCamera('obverse')} />
          </View>
          <View style={styles.buttonWrap}>
            <Button title="Gallery (front)" onPress={() => pickFromGallery('obverse')} />
          </View>
        </View>
        {obverse ? <Image source={{ uri: obverse.uri }} style={styles.image} /> : <Text style={styles.hint}>No front image selected.</Text>}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Back (Reverse) — optional</Text>
        <View style={styles.row}>
          <View style={styles.buttonWrap}>
            <Button title="Camera (back)" onPress={() => captureWithCamera('reverse')} />
          </View>
          <View style={styles.buttonWrap}>
            <Button title="Gallery (back)" onPress={() => pickFromGallery('reverse')} />
          </View>
        </View>
        {reverse ? <Image source={{ uri: reverse.uri }} style={styles.image} /> : <Text style={styles.hint}>No back image selected.</Text>}
      </View>

      <Button title={mutation.isPending ? 'Analyzing...' : 'Analyze coin'} onPress={analyze} disabled={!obverse || mutation.isPending} />
      {mutation.isPending ? <Text style={styles.hint}>Analyzing image(s)…</Text> : null}

      {mutation.data ? (
        <Animated.View
          style={[
            styles.result,
            {
              opacity: resultAnim,
              transform: [
                {
                  translateY: resultAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
                {
                  scale: resultAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultLine}>{mutation.data.country}</Text>
          <Text style={styles.resultLine}>{mutation.data.denomination}</Text>
          <Text style={styles.resultLine}>{mutation.data.year}</Text>
          <Text style={styles.resultLine}>
            {mutation.data.estimatedValueMin} - {mutation.data.estimatedValueMax} {mutation.data.currency}
          </Text>
          <Text style={styles.resultLine}>Confidence: {mutation.data.confidence}</Text>
          <Text style={styles.disclaimer}>Estimate only — not a professional appraisal.</Text>
          <View style={{ height: 12 }} />
          <Button title={savedCoinId ? 'Saved' : 'Save to collection'} onPress={save} disabled={!!savedCoinId} />

          {savedCoinId ? (
            <View style={{ marginTop: 12 }}>
              <Button title="Open saved coin" onPress={() => router.push({ pathname: '/coin/[id]', params: { id: savedCoinId } })} />
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#0b1220',
  },
  pageTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  block: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonWrap: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  hint: {
    color: '#94a3b8',
  },
  result: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    color: '#fff',
    fontWeight: '800',
    marginBottom: 6,
  },
  resultLine: {
    color: '#e5e7eb',
  },
  disclaimer: {
    marginTop: 6,
    color: '#9ca3af',
    fontSize: 12,
  },
});
