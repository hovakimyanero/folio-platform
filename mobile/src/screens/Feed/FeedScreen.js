import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson, api } from '../../services/api';
import ProjectCard from '../../components/ProjectCard';

const TABS = [
  { key: 'foryou', label: 'Для вас', icon: 'sparkles' },
  { key: 'following', label: 'Подписки', icon: 'people' },
  { key: 'trending', label: 'Тренды', icon: 'trending-up' },
  { key: 'discover', label: 'Открытия', icon: 'compass' },
  { key: 'picks', label: 'Выбор недели', icon: 'star' },
];

const PERIODS = ['24h', '7d', '30d'];
const DISCOVER_SECTIONS = ['new', 'underrated', 'rising'];

export default function FeedScreen({ navigation }) {
  const [tab, setTab] = useState('foryou');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [discoverSection, setDiscoverSection] = useState('new');

  const fetchFeed = useCallback(async (pg = 1, append = false) => {
    try {
      let url;
      const limit = 20;
      switch (tab) {
        case 'foryou': url = `/feed/for-you?page=${pg}&limit=${limit}`; break;
        case 'following': url = `/feed/following?page=${pg}&limit=${limit}`; break;
        case 'trending': url = `/feed/trending?period=${period}&page=${pg}&limit=${limit}`; break;
        case 'discover': url = `/feed/discover?section=${discoverSection}&page=${pg}&limit=${limit}`; break;
        case 'picks': url = `/feed/weekly-picks?limit=${limit}`; break;
        default: url = `/feed/for-you?page=${pg}&limit=${limit}`;
      }
      const data = await apiJson(url);
      let list = [];
      if (tab === 'picks') {
        list = (data || []).map(p => p.project || p);
      } else {
        list = data.projects || data || [];
      }
      if (append) setProjects(prev => [...prev, ...list]);
      else setProjects(list);
      setHasMore(list.length >= limit);
      setPage(pg);
    } catch {
      if (!append) setProjects([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [tab, period, discoverSection]);

  useEffect(() => {
    setLoading(true);
    setProjects([]);
    fetchFeed(1);
  }, [fetchFeed]);

  const onRefresh = () => { setRefreshing(true); fetchFeed(1); };
  const loadMore = () => { if (hasMore && !loading) fetchFeed(page + 1, true); };

  const trackView = async (projectId) => {
    try { await api('/feed/interaction', { method: 'POST', body: { projectId, type: 'VIEW' } }); } catch {}
  };

  const renderItem = ({ item }) => (
    <ProjectCard
      project={item}
      onPress={() => {
        trackView(item.id);
        navigation.navigate('ProjectDetail', { id: item.id });
      }}
    />
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={t => t.key}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={16} color={tab === t.key ? '#fff' : '#666'} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sub-filters */}
      {tab === 'trending' && (
        <View style={styles.subRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} style={[styles.subChip, period === p && styles.subChipActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.subText, period === p && styles.subTextActive]}>{p === '24h' ? '24 ч' : p === '7d' ? '7 дн' : '30 дн'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {tab === 'discover' && (
        <View style={styles.subRow}>
          {DISCOVER_SECTIONS.map(s => (
            <TouchableOpacity key={s} style={[styles.subChip, discoverSection === s && styles.subChipActive]} onPress={() => setDiscoverSection(s)}>
              <Text style={[styles.subText, discoverSection === s && styles.subTextActive]}>
                {s === 'new' ? 'Новые' : s === 'underrated' ? 'Недооценённые' : 'Растущие'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && projects.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Лента пуста</Text>
            </View>
          }
          ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} color="#6C5CE7" /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tabActive: { backgroundColor: '#6C5CE7' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#666' },
  tabTextActive: { color: '#fff' },
  subRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: '#fff' },
  subChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0' },
  subChipActive: { backgroundColor: '#6C5CE7' },
  subText: { fontSize: 12, color: '#666' },
  subTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
