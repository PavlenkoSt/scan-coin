import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useCollectionStore } from '../../src/store/collectionStore';

export default function CollectionScreen() {
  const coins = useCollectionStore((s) => s.coins);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Collection</Text>
      {coins.length === 0 ? (
        <Text style={styles.empty}>No coins saved yet. Scan your first coin.</Text>
      ) : (
        <FlatList
          data={coins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/coin/[id]', params: { id: item.id } }} style={styles.row}>
              {item.country || 'Unknown'} • {item.denomination || 'Coin'} • {item.year || 'N/A'}
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  empty: {
    color: '#666',
  },
  row: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
});
