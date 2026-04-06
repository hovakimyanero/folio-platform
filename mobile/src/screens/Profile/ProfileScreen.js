import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson, api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from '../../components/ProjectCard';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const { user: me } = useAuth();
  const isMe = me?.username === username;

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [userData, projData] = await Promise.all([
        apiJson(`/users/${username}`),
        apiJson(`/users/${username}/projects`),
      ]);
      setProfile(userData.user || userData);
      setFollowing(userData.user?.isFollowing || false);
      setProjects(projData.projects || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!profile) return;
    const method = following ? 'DELETE' : 'POST';
    try {
      await api(`/users/${profile.id}/follow`, { method });
      setFollowing(!following);
      setProfile(p => ({
        ...p,
        _count: { ...p._count, followers: p._count.followers + (following ? -1 : 1) },
      }));
    } catch (_) {}
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: '#999' }}>Пользователь не найден</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Cover */}
      <View style={styles.coverContainer}>
        {profile.cover ? (
          <Image source={{ uri: profile.cover }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, { backgroundColor: '#6C5CE7' }]} />
        )}
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar & Info */}
      <View style={styles.infoContainer}>
        <Image
          source={{ uri: profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&background=6C5CE7&color=fff` }}
          style={styles.avatar}
        />
        <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>

        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.metaRow}>
          {profile.location ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#999" />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          ) : null}
          {profile.website ? (
            <TouchableOpacity style={styles.metaItem} onPress={() => Linking.openURL(profile.website)}>
              <Ionicons name="link-outline" size={14} color="#6C5CE7" />
              <Text style={[styles.metaText, { color: '#6C5CE7' }]}>{profile.website}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile._count?.projects || 0}</Text>
            <Text style={styles.statLabel}>Работ</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile._count?.followers || 0}</Text>
            <Text style={styles.statLabel}>Подписч.</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile._count?.following || 0}</Text>
            <Text style={styles.statLabel}>Подписок</Text>
          </View>
        </View>

        {/* Actions */}
        {isMe ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={16} color="#6C5CE7" />
            <Text style={styles.editBtnText}>Настройки</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Отписаться' : 'Подписаться'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => navigation.navigate('Chat', { partnerId: profile.id, partnerName: profile.displayName || profile.username })}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#6C5CE7" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Работы</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={{ paddingBottom: 24 }}
      columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <ProjectCard project={item} onPress={() => navigation.navigate('ProjectDetail', { id: item.id })} />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
      ListEmptyComponent={<Text style={styles.emptyText}>Нет проектов</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  coverContainer: { position: 'relative' },
  cover: { width, height: 160 },
  backArrow: {
    position: 'absolute', top: 48, left: 12, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  infoContainer: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff' },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff', marginTop: -45 },
  displayName: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginTop: 8 },
  username: { fontSize: 14, color: '#999', marginTop: 2 },
  bio: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#999' },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#6C5CE7',
  },
  editBtnText: { fontSize: 14, color: '#6C5CE7', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  followBtn: {
    backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
  },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6C5CE7' },
  followBtnText: { color: '#fff', fontWeight: '600' },
  followingBtnText: { color: '#6C5CE7' },
  msgBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#6C5CE7',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 20, alignSelf: 'flex-start' },
  emptyText: { textAlign: 'center', color: '#999', padding: 32 },
});
