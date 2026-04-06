import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const search = useCallback(async (q, pg = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await apiJson(`/projects?search=${encodeURIComponent(q.trim())}&page=${pg}&limit=20`);
      const list = data.projects || data;
      if (pg === 1) setResults(list);
      else setResults(prev => [...prev, ...list]);
      setHasMore(list.length === 20);
      setPage(pg);
      setSearched(true);
    } catch (_) {}
    setLoading(false);
  }, []);

  const loadMore = () => { if (hasMore && !loading) search(query, page + 1); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск проектов..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query, 1)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!searched && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Введите запрос для поиска</Text>
        </View>
      )}

      {searched && results.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Ничего не найдено</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => navigation.navigate('ProjectDetail', { id: item.id })} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} color="#6C5CE7" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 12,
    paddingBottom: 12, backgroundColor: '#fff', gap: 8,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0',
    borderRadius: 12, paddingHorizontal: 12, height: 40, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
