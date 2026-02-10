import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useCollectionStore } from '../../src/store/collectionStore';

export default function CoinDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coin = useCollectionStore((s) => s.coins.find((item) => item.id === id));

  if (!coin) {
    return (
      <View style={styles.container}>
        <Text>Coin not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: coin.imageUri }} style={styles.image} />
      <Text style={styles.title}>{coin.country || 'Unknown coin'}</Text>
      <Text>{coin.denomination}</Text>
      <Text>Year: {coin.year}</Text>
      <Text>
        Estimated value: {coin.estimatedValueMin} - {coin.estimatedValueMax} {coin.currency}
      </Text>
      <Text>Confidence: {coin.confidence}</Text>
      <Text style={styles.disclaimer}>Estimate only — not a professional appraisal.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  title: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 12,
  },
});
