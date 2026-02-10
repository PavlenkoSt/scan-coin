import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCollectionStore } from '../../src/store/collectionStore';

export default function CollectionScreen() {
  const coins = useCollectionStore((s) => s.coins);
  const [query, setQuery] = useState('');

  const filteredCoins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coins;

    return coins.filter((coin) => {
      const haystack = `${coin.country || ''} ${coin.denomination || ''} ${coin.year || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [coins, query]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Collection</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by country, denomination, year"
        style={styles.search}
      />

      {coins.length === 0 ? (
        <Text style={styles.empty}>No coins saved yet. Scan your first coin.</Text>
      ) : filteredCoins.length === 0 ? (
        <Text style={styles.empty}>No results found for “{query}”.</Text>
      ) : (
        <FlatList
          data={filteredCoins}
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
  search: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
