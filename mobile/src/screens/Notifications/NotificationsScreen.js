import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

const ICON_MAP = {
  LIKE: { name: 'heart', color: '#e74c3c' },
  COMMENT: { name: 'chatbubble', color: '#3498db' },
  FOLLOW: { name: 'person-add', color: '#6C5CE7' },
  CHALLENGE_WINNER: { name: 'trophy', color: '#f9a825' },
  MENTION: { name: 'at', color: '#00b894' },
};

const TEXT_MAP = {
  LIKE: 'понравился ваш проект',
  COMMENT: 'прокомментировал ваш проект',
  FOLLOW: 'подписался на вас',
  CHALLENGE_WINNER: 'Вы победили в челлендже!',
  MENTION: 'упомянул вас',
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await apiJson('/notifications/read', { method: 'PATCH', body: {} });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handlePress = (notif) => {
    // Mark single as read
    if (!notif.read) {
      apiJson('/notifications/read', { method: 'PATCH', body: { ids: [notif.id] } }).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    }

    // Navigate
    if (notif.entityType === 'project' && notif.entityId) {
      navigation.navigate('ProjectDetail', { id: notif.entityId });
    } else if (notif.entityType === 'challenge' && notif.entityId) {
      navigation.navigate('ChallengeDetail', { id: notif.entityId });
    } else if (notif.type === 'FOLLOW' && notif.actor?.username) {
      navigation.navigate('Profile', { username: notif.actor.username });
    }
  };

  const renderItem = ({ item }) => {
    const icon = ICON_MAP[item.type] || { name: 'notifications', color: '#999' };
    const text = TEXT_MAP[item.type] || 'уведомление';
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardText}>
            <Text style={styles.actorName}>
              {item.actor?.displayName || item.actor?.username || ''}
            </Text>
            {' '}{text}
          </Text>
          <Text style={styles.cardTime}>{timeAgo}</Text>
        </View>
        {item.actor?.avatar && (
          <Image source={{ uri: item.actor.avatar }} style={styles.actorAvatar} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Уведомления</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Прочитать все</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Нет уведомлений</Text>
          </View>
        }
      />
    </View>
  );
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн.`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  markAllText: { fontSize: 14, color: '#6C5CE7', fontWeight: '500' },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  cardUnread: { backgroundColor: '#f5f3ff' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardText: { fontSize: 14, color: '#555', lineHeight: 20 },
  actorName: { fontWeight: '700', color: '#1a1a2e' },
  cardTime: { fontSize: 12, color: '#999', marginTop: 2 },
  actorAvatar: { width: 36, height: 36, borderRadius: 18, marginLeft: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
