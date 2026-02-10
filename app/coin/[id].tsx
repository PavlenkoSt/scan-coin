import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useCollectionStore } from '../../src/store/collectionStore';

export default function CoinDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coin = useCollectionStore((s) => s.coins.find((item) => item.id === id));

  if (!coin) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Coin not found</Text>
          <Text style={styles.subtitle}>It may have been removed from your local collection.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: coin.imageUri }} style={styles.image} />

      <View style={styles.card}>
        <Text style={styles.title}>{coin.country || 'Unknown coin'}</Text>
        <Text style={styles.subtitle}>{coin.denomination}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Year</Text>
          <Text style={styles.metaValue}>{coin.year}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Estimated value</Text>
          <Text style={styles.metaValue}>
            {coin.estimatedValueMin} - {coin.estimatedValueMax} {coin.currency}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Confidence</Text>
          <Text style={styles.confidence}>{coin.confidence.toUpperCase()}</Text>
        </View>

        <Text style={styles.disclaimer}>Estimate only — not a professional appraisal.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    padding: 16,
    gap: 14,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#1f2937',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#9ca3af',
  },
  metaValue: {
    color: '#fff',
    fontWeight: '600',
  },
  confidence: {
    color: '#fbbf24',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  disclaimer: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
  },
});
