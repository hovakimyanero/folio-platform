import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ConversationsScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson('/messages');
      setConversations(data.conversations || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  const renderItem = ({ item }) => {
    const partner = item.partner;
    const last = item.lastMessage;
    const isMyMsg = last?.senderId === user?.id;
    const time = last ? new Date(last.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chat', {
          partnerId: partner.id,
          partnerName: partner.displayName || partner.username,
        })}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: partner.avatar || `https://ui-avatars.com/api/?name=${partner.username}&background=6C5CE7&color=fff` }}
            style={styles.avatar}
          />
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread > 9 ? '9+' : item.unread}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.name, item.unread > 0 && styles.nameBold]}>{partner.displayName || partner.username}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={[styles.lastMsg, item.unread > 0 && styles.lastMsgBold]} numberOfLines={1}>
            {isMyMsg ? 'Вы: ' : ''}{last?.content || 'Файл'}
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
        <Text style={styles.headerTitle}>Сообщения</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partner.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Нет сообщений</Text>
          </View>
        }
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
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  unreadBadge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, color: '#1a1a2e' },
  nameBold: { fontWeight: '700' },
  time: { fontSize: 12, color: '#999' },
  lastMsg: { fontSize: 13, color: '#999', marginTop: 2 },
  lastMsgBold: { color: '#555', fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
