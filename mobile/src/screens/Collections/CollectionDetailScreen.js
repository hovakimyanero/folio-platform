import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

export default function CollectionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson(`/collections/${id}`);
      setCollection(data.collection || data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  if (!collection) return <View style={styles.center}><Text style={{ color: '#999' }}>Не найдено</Text></View>;

  const projects = (collection.items || []).map(i => i.project).filter(Boolean);

  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={{ paddingBottom: 24 }}
      columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
      ListHeaderComponent={() => (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <View style={styles.info}>
            <Text style={styles.name}>{collection.name}</Text>
            {collection.description ? <Text style={styles.desc}>{collection.description}</Text> : null}
            <View style={styles.metaRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile', { username: collection.user?.username })}
                style={styles.authorRow}
              >
                <Image
                  source={{ uri: collection.user?.avatar || `https://ui-avatars.com/api/?name=${collection.user?.username}` }}
                  style={styles.authorAvatar}
                />
                <Text style={styles.authorName}>{collection.user?.displayName || collection.user?.username}</Text>
              </TouchableOpacity>
              <Text style={styles.count}>{projects.length} проектов</Text>
              {collection.isPrivate && <Ionicons name="lock-closed" size={14} color="#999" />}
            </View>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <ProjectCard project={item} onPress={() => navigation.navigate('ProjectDetail', { id: item.id })} />
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>Коллекция пуста</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  header: {
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff', marginBottom: 8,
  },
  backBtn: { marginBottom: 12 },
  info: {},
  name: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  desc: { fontSize: 14, color: '#666', marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12 },
  authorName: { fontSize: 13, color: '#555', fontWeight: '500' },
  count: { fontSize: 13, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', padding: 32 },
});
