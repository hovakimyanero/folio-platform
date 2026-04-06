import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from '../../components/ProjectCard';

export default function ChallengeDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson(`/challenges/${id}`);
      setChallenge(data.challenge || data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const participate = async () => {
    try {
      // Get user's projects
      const projData = await apiJson(`/users/${user.username}/projects`);
      const myProjects = projData.projects || [];
      if (myProjects.length === 0) {
        return Alert.alert('Нет проектов', 'Сначала загрузите проект');
      }

      // Simple: submit the latest project
      const titles = myProjects.slice(0, 5).map(p => p.title);
      Alert.alert(
        'Выберите проект',
        'Будет отправлен ваш последний проект: ' + myProjects[0].title,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отправить', onPress: async () => {
              try {
                await apiJson(`/challenges/${id}/participate`, {
                  method: 'POST',
                  body: { projectId: myProjects[0].id },
                });
                Alert.alert('Готово', 'Вы участвуете!');
                load();
              } catch (e) {
                Alert.alert('Ошибка', e.message);
              }
            }
          },
        ]
      );
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;
  if (!challenge) return <View style={styles.center}><Text style={{ color: '#999' }}>Не найдено</Text></View>;

  const active = challenge.isActive && new Date(challenge.deadline) > new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.deadline) - Date.now()) / 86400000));
  const entries = challenge.entries || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, active ? styles.activeBadge : styles.closedBadge]}>
          <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.closedBadgeText]}>
            {active ? `Активный • ${daysLeft} дн.` : 'Завершён'}
          </Text>
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.description ? <Text style={styles.description}>{challenge.description}</Text> : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{challenge._count?.entries || entries.length}</Text>
            <Text style={styles.statLabel}>Участников</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {new Date(challenge.deadline).toLocaleDateString('ru-RU')}
            </Text>
            <Text style={styles.statLabel}>Дедлайн</Text>
          </View>
        </View>

        {active && !challenge.hasEntered && user && (
          <TouchableOpacity style={styles.participateBtn} onPress={participate}>
            <Text style={styles.participateBtnText}>Участвовать</Text>
          </TouchableOpacity>
        )}

        {challenge.hasEntered && (
          <View style={styles.enteredBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
            <Text style={styles.enteredText}>Вы участвуете</Text>
          </View>
        )}

        {entries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Работы участников</Text>
            {entries.map((entry, index) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryRow}
                onPress={() => entry.project && navigation.navigate('ProjectDetail', { id: entry.project.id })}
              >
                <Text style={styles.entryRank}>#{index + 1}</Text>
                <Image
                  source={{ uri: entry.user?.avatar || `https://ui-avatars.com/api/?name=${entry.user?.username}` }}
                  style={styles.entryAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryTitle} numberOfLines={1}>
                    {entry.project?.title || 'Проект'}
                  </Text>
                  <Text style={styles.entryAuthor}>
                    {entry.user?.displayName || entry.user?.username}
                  </Text>
                </View>
                {entry.isWinner && <Ionicons name="trophy" size={20} color="#f9a825" />}
                <Text style={styles.entryScore}>{entry.score || 0}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff' },
  content: { padding: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  activeBadge: { backgroundColor: '#e8f5e9' },
  closedBadge: { backgroundColor: '#f5f5f5' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  activeBadgeText: { color: '#2e7d32' },
  closedBadgeText: { color: '#999' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  description: { fontSize: 15, color: '#555', lineHeight: 22, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  participateBtn: {
    backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  participateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  enteredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: '#e8f5e9', padding: 12, borderRadius: 12,
  },
  enteredText: { color: '#2e7d32', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginTop: 24, marginBottom: 12 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 12, borderRadius: 12, marginBottom: 8, gap: 10,
  },
  entryRank: { fontSize: 14, fontWeight: '700', color: '#6C5CE7', width: 28 },
  entryAvatar: { width: 36, height: 36, borderRadius: 18 },
  entryTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  entryAuthor: { fontSize: 12, color: '#999', marginTop: 1 },
  entryScore: { fontSize: 14, fontWeight: '600', color: '#999' },
});
