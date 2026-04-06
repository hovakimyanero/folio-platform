import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

export default function ChallengesScreen({ navigation }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson('/challenges');
      setChallenges(data.challenges || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isActive = (ch) => ch.isActive && new Date(ch.deadline) > new Date();

  const renderItem = ({ item }) => {
    const active = isActive(item);
    const daysLeft = Math.max(0, Math.ceil((new Date(item.deadline) - Date.now()) / 86400000));

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ChallengeDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, active ? styles.activeBadge : styles.closedBadge]}>
            <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.closedBadgeText]}>
              {active ? 'Активный' : 'Завершён'}
            </Text>
          </View>
          {active && <Text style={styles.daysLeft}>{daysLeft} дн.</Text>}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={16} color="#999" />
            <Text style={styles.footerText}>{item._count?.entries || 0} участников</Text>
          </View>
          <Text style={styles.deadline}>
            до {new Date(item.deadline).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Челленджи</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет челленджей</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  activeBadge: { backgroundColor: '#e8f5e9' },
  closedBadge: { backgroundColor: '#f5f5f5' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  activeBadgeText: { color: '#2e7d32' },
  closedBadgeText: { color: '#999' },
  daysLeft: { fontSize: 13, color: '#6C5CE7', fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: '#999' },
  deadline: { fontSize: 12, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', padding: 32 },
});
