import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.badge}>AI Coin Scanner</Text>
        <Text style={styles.title}>Scan coins beautifully</Text>
        <Text style={styles.subtitle}>Capture front and back, get a smart estimate, and save to your collection.</Text>

        <Link href="/scan" style={styles.primaryButton}>
          Start scanning
        </Link>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2-side</Text>
          <Text style={styles.statLabel}>analysis</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Local</Text>
          <Text style={styles.statLabel}>collection</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Fast</Text>
          <Text style={styles.statLabel}>results</Text>
        </View>
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
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    color: '#111827',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#f59e0b',
    color: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    gap: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
