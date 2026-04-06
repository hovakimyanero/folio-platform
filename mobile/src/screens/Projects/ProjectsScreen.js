import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { apiJson } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

const SORTS = [
  { key: 'latest', label: 'Новые' },
  { key: 'popular', label: 'Популярные' },
  { key: 'mostLiked', label: 'По лайкам' },
];

export default function ProjectsScreen({ navigation, route }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('latest');
  const category = route?.params?.category;

  const load = useCallback(async (p = 1, reset = false) => {
    try {
      let url = `/projects?page=${p}&limit=12&sort=${sort}`;
      if (category) url += `&category=${category}`;
      const data = await apiJson(url);
      setProjects(prev => reset || p === 1 ? data.projects : [...prev, ...data.projects]);
      setPage(data.pagination?.page || p);
      setTotalPages(data.pagination?.pages || 1);
    } catch {}
    setLoading(false);
  }, [sort, category]);

  useEffect(() => { setLoading(true); load(1, true); }, [load]);

  const loadMore = () => {
    if (page < totalPages) load(page + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Проекты</Text>
      </View>

      {/* Sort tabs */}
      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortTab, sort === s.key && styles.sortActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>
      ) : (
        <FlatList
          data={projects}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => navigation.navigate('ProjectDetail', { id: item.id })}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text style={styles.empty}>Проекты не найдены</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  sortRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', gap: 8,
  },
  sortTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sortActive: { backgroundColor: '#6C5CE7' },
  sortText: { fontSize: 13, fontWeight: '500', color: '#666' },
  sortTextActive: { color: '#fff' },
  grid: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
