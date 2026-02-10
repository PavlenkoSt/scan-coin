import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

function ActionButton({
  title,
  onPress,
  icon,
  variant = 'secondary',
  disabled,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? '#111827' : '#e5e7eb';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        variant === 'primary' && styles.actionBtnPrimary,
        variant === 'secondary' && styles.actionBtnSecondary,
        variant === 'ghost' && styles.actionBtnGhost,
        (pressed || disabled) && styles.actionBtnPressed,
      ]}
    >
      <View style={styles.actionContent}>
        {icon ? <Ionicons name={icon} size={16} color={textColor} /> : null}
        <Text
          style={[
            styles.actionBtnText,
            variant === 'primary' && styles.actionBtnTextPrimary,
            variant !== 'primary' && styles.actionBtnTextSecondary,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

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
    onMutate: async () => Haptics.selectionAsync(),
    onSuccess: async () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    onError: async (error: any) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = String(error?.message || 'Scan failed. Please try another photo.');
      if (message.toLowerCase().includes('quota')) return Alert.alert('AI quota issue', message);
      if (message.toLowerCase().includes('image too large')) {
        return Alert.alert('Image too large', 'Please retake with better framing or use lower resolution image.');
      }
      Alert.alert('Scan failed', message);
    },
  });

  useEffect(() => {
    if (mutation.data) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 70 }).start();
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
    if (!permission.granted) return Alert.alert('Permission required', 'Please allow photo library access to select a coin image.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: COMPRESS, base64: false });
    if (!result.canceled && result.assets[0]) await applyPickedAsset(side, result.assets[0]);
  };

  const captureWithCamera = async (side: CoinSide) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Please allow camera access to scan coins.');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: COMPRESS,
      base64: false,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) await applyPickedAsset(side, result.assets[0]);
  };

  const analyze = async () => {
    if (!obverse) return Alert.alert('Obverse required', 'Please capture or select the front side first.');

    await mutation.mutateAsync({
      obverse: { imageUri: obverse.uri, imageBase64: obverse.base64, mimeType: obverse.mimeType },
      reverse: reverse ? { imageUri: reverse.uri, imageBase64: reverse.base64, mimeType: reverse.mimeType } : undefined,
    });
  };

  const save = async () => {
    if (!obverse || !mutation.data || savedCoinId) return;
    const coin = { id: createId(), createdAt: new Date().toISOString(), imageUri: obverse.uri, ...mutation.data };
    addCoin(coin);
    setSavedCoinId(coin.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Coin added to your collection.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Scan Coin</Text>
      <Text style={styles.hint}>Capture both sides in good lighting for better identification.</Text>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Front (Obverse) — required</Text>
        <View style={styles.row}>
          <View style={styles.buttonWrap}><ActionButton icon="camera-outline" title="Camera (front)" onPress={() => captureWithCamera('obverse')} /></View>
          <View style={styles.buttonWrap}><ActionButton icon="images-outline" title="Gallery (front)" onPress={() => pickFromGallery('obverse')} variant="ghost" /></View>
        </View>
        {obverse ? <Image source={{ uri: obverse.uri }} style={styles.image} /> : <Text style={styles.hint}>No front image selected.</Text>}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Back (Reverse) — optional</Text>
        <View style={styles.row}>
          <View style={styles.buttonWrap}><ActionButton icon="camera-outline" title="Camera (back)" onPress={() => captureWithCamera('reverse')} /></View>
          <View style={styles.buttonWrap}><ActionButton icon="images-outline" title="Gallery (back)" onPress={() => pickFromGallery('reverse')} variant="ghost" /></View>
        </View>
        {reverse ? <Image source={{ uri: reverse.uri }} style={styles.image} /> : <Text style={styles.hint}>No back image selected.</Text>}
      </View>

      <ActionButton icon="sparkles-outline" title={mutation.isPending ? 'Analyzing...' : 'Analyze coin'} onPress={analyze} variant="primary" disabled={!obverse || mutation.isPending} />
      {mutation.isPending ? <Text style={styles.hint}>Analyzing image(s)…</Text> : null}

      {mutation.data ? (
        <Animated.View
          style={[
            styles.result,
            {
              opacity: resultAnim,
              transform: [
                { translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                { scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ],
            },
          ]}
        >
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultLine}>{mutation.data.country}</Text>
          <Text style={styles.resultLine}>{mutation.data.denomination}</Text>
          <Text style={styles.resultLine}>{mutation.data.year}</Text>
          <Text style={styles.resultLine}>{mutation.data.estimatedValueMin} - {mutation.data.estimatedValueMax} {mutation.data.currency}</Text>
          <Text style={styles.resultLine}>Confidence: {mutation.data.confidence}</Text>
          <Text style={styles.disclaimer}>Estimate only — not a professional appraisal.</Text>
          <View style={{ height: 12 }} />
          <ActionButton icon="bookmark-outline" title={savedCoinId ? 'Saved' : 'Save to collection'} onPress={save} variant="primary" disabled={!!savedCoinId} />
          {savedCoinId ? (
            <View style={{ marginTop: 10 }}>
              <ActionButton icon="open-outline" title="Open saved coin" onPress={() => router.push({ pathname: '/coin/[id]', params: { id: savedCoinId } })} />
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#0b1220' },
  pageTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  block: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  buttonWrap: { flex: 1 },
  sectionTitle: { color: '#fff', fontWeight: '700' },
  image: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#1f2937' },
  hint: { color: '#94a3b8' },

  actionBtn: { borderRadius: 12, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnPrimary: { backgroundColor: '#fbbf24' },
  actionBtnSecondary: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#334155' },
  actionBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' },
  actionBtnPressed: { opacity: 0.7 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  actionBtnTextPrimary: { color: '#111827' },
  actionBtnTextSecondary: { color: '#e5e7eb' },

  result: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, gap: 4 },
  resultTitle: { color: '#fff', fontWeight: '800', marginBottom: 6 },
  resultLine: { color: '#e5e7eb' },
  disclaimer: { marginTop: 6, color: '#9ca3af', fontSize: 12 },
});
