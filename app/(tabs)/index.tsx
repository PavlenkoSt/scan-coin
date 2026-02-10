import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Coin</Text>
      <Text style={styles.subtitle}>Identify coins quickly and save them to your collection.</Text>

      <Link href="/scan" style={styles.button}>
        Start Scanning
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#111827',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
    fontWeight: '600',
  },
});
