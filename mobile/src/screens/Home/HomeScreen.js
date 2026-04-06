import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

const CATEGORIES = [
  { name: 'Графический дизайн', slug: 'graphic-design', icon: '🎨' },
  { name: 'UI/UX', slug: 'ui-ux', icon: '📱' },
  { name: 'Иллюстрация', slug: 'illustration', icon: '✏️' },
  { name: '3D', slug: '3d', icon: '🧊' },
  { name: 'Моушн-дизайн', slug: 'motion-design', icon: '🎬' },
  { name: 'Фотография', slug: 'photography', icon: '📷' },
  { name: 'Веб-дизайн', slug: 'web-design', icon: '🌐' },
  { name: 'Брендинг', slug: 'branding', icon: '💎' },
];

export default function HomeScreen({ navigation }) {
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [trendRes, latestRes] = await Promise.all([
        apiJson('/projects?sort=popular&limit=8'),
        apiJson('/projects?sort=latest&limit=8'),
      ]);
      setTrending(trendRes.projects || []);
      setLatest(latestRes.projects || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Folio</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={24} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={styles.categoryChip}
            onPress={() => navigation.navigate('ProjectsTab', { category: cat.slug })}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Популярное</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProjectsTab')}>
            <Text style={styles.seeAll}>Все</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {trending.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              style={{ width: 200, marginRight: 12 }}
              onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}
            />
          ))}
        </ScrollView>
      </View>

      {/* Latest */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🕐 Новое</Text>
        </View>
        <View style={styles.grid}>
          {latest.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}
            />
          ))}
        </View>
      </View>

      {/* Quick links */}
      <View style={styles.links}>
        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Collections')}>
          <Ionicons name="albums" size={28} color="#6C5CE7" />
          <Text style={styles.linkText}>Коллекции</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Challenges')}>
          <Ionicons name="trophy" size={28} color="#F39C12" />
          <Text style={styles.linkText}>Челленджи</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Conversations')}>
          <Ionicons name="chatbubbles" size={28} color="#00b894" />
          <Text style={styles.linkText}>Сообщения</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#fff',
  },
  logo: { fontSize: 28, fontWeight: '800', color: '#6C5CE7' },
  categoriesRow: { paddingHorizontal: 16, paddingVertical: 12 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryName: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  seeAll: { fontSize: 14, color: '#6C5CE7', fontWeight: '500' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  links: {
    flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 12,
  },
  linkCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  linkText: { fontSize: 12, fontWeight: '500', color: '#1a1a2e', marginTop: 6 },
});
