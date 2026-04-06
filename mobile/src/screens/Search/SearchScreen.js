import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

const TABS = ['projects', 'users', 'tags'];
const TAB_LABELS = { projects: 'Проекты', users: 'Авторы', tags: 'Теги' };

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    apiJson('/tags/popular?limit=20').then(setPopularTags).catch(() => {});
  }, []);

  const search = useCallback(async (q, pg = 1, type = tab) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      if (type === 'projects') {
        const data = await apiJson(`/projects?search=${encodeURIComponent(q.trim())}&page=${pg}&limit=20`);
        const list = data.projects || [];
        if (pg === 1) setProjects(list);
        else setProjects(prev => [...prev, ...list]);
        setHasMore(list.length === 20);
      } else if (type === 'users') {
        const data = await apiJson(`/users?search=${encodeURIComponent(q.trim())}&limit=30`);
        setUsers(data.users || []);
        setHasMore(false);
      } else if (type === 'tags') {
        const data = await apiJson(`/tags/autocomplete?q=${encodeURIComponent(q.trim())}&limit=30`);
        setTags(data || []);
        setHasMore(false);
      }
      setPage(pg);
      setSearched(true);
    } catch (_) {}
    setLoading(false);
  }, [tab]);

  const loadMore = () => { if (hasMore && !loading && tab === 'projects') search(query, page + 1); };

  const handleTabChange = (t) => {
    setTab(t);
    if (query.trim()) search(query, 1, t);
  };

  const searchTag = (name) => {
    setQuery(name);
    setTab('projects');
    search(name, 1, 'projects');
  };

  const results = tab === 'projects' ? projects : tab === 'users' ? users : tags;

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
            placeholder="Проекты, авторы, теги..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query, 1)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setProjects([]); setUsers([]); setTags([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => handleTabChange(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular tags when nothing searched */}
      {!searched && !loading && popularTags.length > 0 && (
        <ScrollView style={{ maxHeight: 140 }} contentContainerStyle={{ padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 }}>Популярные теги</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {popularTags.map(t => (
              <TouchableOpacity key={t.id} style={styles.tagChip} onPress={() => searchTag(t.name)}>
                <Text style={styles.tagChipText}>#{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {!searched && !loading && popularTags.length === 0 && (
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

      {tab === 'projects' && (
        <FlatList
          data={projects}
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
      )}

      {tab === 'users' && (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userRow} onPress={() => navigation.navigate('Profile', { username: item.username })}>
              <Image source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.displayName}&background=6C5CE7&color=fff` }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1a1a2e' }}>{item.displayName}</Text>
                <Text style={{ fontSize: 12, color: '#999' }}>@{item.username}</Text>
                {item.headline ? <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }} numberOfLines={1}>{item.headline}</Text> : null}
              </View>
              {(item.openToWork || item.openToHire) && (
                <View style={{ gap: 2 }}>
                  {item.openToWork && <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.15)' }}><Text style={{ fontSize: 9, color: '#10b981' }}>Open</Text></View>}
                  {item.openToHire && <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 100, backgroundColor: 'rgba(99,102,241,0.15)' }}><Text style={{ fontSize: 9, color: '#6366f1' }}>Hiring</Text></View>}
                </View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} color="#6C5CE7" /> : null}
        />
      )}

      {tab === 'tags' && (
        <FlatList
          data={tags}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tagRow} onPress={() => searchTag(item.name)}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#6C5CE7' }}>#{item.name}</Text>
              <Text style={{ fontSize: 12, color: '#999' }}>{item.useCount} проект.</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} color="#6C5CE7" /> : null}
        />
      )}
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
  tabsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#6C5CE7' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#999' },
  tabTextActive: { color: '#6C5CE7' },
  tagChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: '#f0edff',
  },
  tagChipText: { fontSize: 12, color: '#6C5CE7' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
  },
});
