import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiJson('/analytics/overview');
      setData(res);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  }

  if (!data) {
    return <View style={styles.center}><Text style={{ color: '#999' }}>Нет данных</Text></View>;
  }

  const stats = [
    { label: 'Просмотры', value: data.totalViews || 0, icon: 'eye', color: '#6C5CE7' },
    { label: 'Лайки', value: data.totalLikes || 0, icon: 'heart', color: '#e74c3c' },
    { label: 'Сохранения', value: data.totalSaves || 0, icon: 'bookmark', color: '#f39c12' },
    { label: 'Подписчики', value: data.followers || 0, icon: 'people', color: '#00b894' },
    { label: 'Просм. профиля', value: data.profileViews || 0, icon: 'person', color: '#0984e3' },
    { label: 'Вовлечённость', value: `${(data.engagementRate || 0).toFixed(1)}%`, icon: 'pulse', color: '#e17055' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6C5CE7" />}
    >
      <Text style={styles.title}>Аналитика</Text>

      <View style={styles.grid}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Ionicons name={s.icon} size={22} color={s.color} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Top projects */}
      {data.topProjects?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Топ проекты</Text>
          {data.topProjects.map((p, i) => (
            <View key={p.id} style={styles.topRow}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.topTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.topMeta}>
                  {p.viewCount || 0} просм. · {p.likeCount || 0} лайков · {p.saveCount || 0} сохр.
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Traffic sources */}
      {data.trafficSources?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Источники трафика</Text>
          {data.trafficSources.map((s, i) => (
            <View key={i} style={styles.sourceRow}>
              <Text style={styles.sourceName}>{s.source || 'Прямой'}</Text>
              <Text style={styles.sourceCount}>{s._count || s.count || 0}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  statCard: {
    width: (width - 40) / 2, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  topRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, marginBottom: 8, gap: 12,
  },
  topRank: { fontSize: 18, fontWeight: '800', color: '#6C5CE7', width: 30 },
  topTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  topMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  sourceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  sourceName: { fontSize: 14, color: '#1a1a2e' },
  sourceCount: { fontSize: 14, fontWeight: '700', color: '#6C5CE7' },
});
