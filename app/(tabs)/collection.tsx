import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCollectionStore } from '../../src/store/collectionStore';

function confidenceColor(conf: string) {
  const c = conf.toLowerCase();
  if (c === 'high') return '#22c55e';
  if (c === 'medium') return '#fbbf24';
  return '#f97316';
}

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
      <Text style={styles.subtitle}>{coins.length} saved coin{coins.length === 1 ? '' : 's'}</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by country, denomination, year"
        placeholderTextColor="#94a3b8"
        style={styles.search}
      />

      {coins.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No coins yet</Text>
          <Text style={styles.emptyText}>Go to Scan and add your first coin.</Text>
        </View>
      ) : filteredCoins.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptyText}>Nothing found for “{query}”.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCoins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/coin/[id]', params: { id: item.id } }} style={styles.row}>
              <Text style={styles.rowTitle}>{item.country || 'Unknown coin'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.rowMeta}>
                  {item.denomination || 'Coin'} • {item.year || 'N/A'}
                </Text>
                <Text style={[styles.confidencePill, { borderColor: confidenceColor(item.confidence), color: confidenceColor(item.confidence) }]}>
                  {item.confidence.toUpperCase()}
                </Text>
              </View>
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 12,
  },
  search: {
    backgroundColor: '#111827',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  emptyCard: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyText: {
    color: '#9ca3af',
  },
  row: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    gap: 4,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#9ca3af',
    fontSize: 13,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidencePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
  },
});
