import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson, api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CollectionsScreen({ navigation }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson('/collections');
      setCollections(data.collections || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCollection = async () => {
    if (!newName.trim()) return;
    try {
      await apiJson('/collections', {
        method: 'POST',
        body: { name: newName.trim(), description: newDesc, isPrivate: newPrivate },
      });
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      setNewPrivate(false);
      load();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const deleteCollection = (id) => {
    Alert.alert('Удалить', 'Удалить эту коллекцию?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          await api(`/collections/${id}`, { method: 'DELETE' });
          setCollections(prev => prev.filter(c => c.id !== id));
        }
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CollectionDetail', { id: item.id })}
      onLongPress={() => item.userId === user?.id && deleteCollection(item.id)}
    >
      {item.cover ? (
        <Image source={{ uri: item.cover }} style={styles.cardCover} />
      ) : (
        <View style={[styles.cardCover, styles.cardCoverPlaceholder]}>
          <Ionicons name="folder-open" size={32} color="#ccc" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor}>{item.user?.displayName || item.user?.username}</Text>
          <Text style={styles.cardCount}>{item._count?.items || 0} •</Text>
          {item.isPrivate && <Ionicons name="lock-closed" size={12} color="#999" />}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Коллекции</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={26} color="#6C5CE7" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6C5CE7']} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет коллекций</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новая коллекция</Text>
            <TextInput style={styles.input} placeholder="Название *" placeholderTextColor="#999"
              value={newName} onChangeText={setNewName} />
            <TextInput style={[styles.input, { height: 70 }]} placeholder="Описание" placeholderTextColor="#999"
              value={newDesc} onChangeText={setNewDesc} multiline />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Приватная</Text>
              <Switch value={newPrivate} onValueChange={setNewPrivate} trackColor={{ true: '#6C5CE7' }} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={createCollection}>
                <Text style={styles.createBtnText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardCover: { width: '100%', height: 140 },
  cardCoverPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 12 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardAuthor: { fontSize: 13, color: '#999' },
  cardCount: { fontSize: 13, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', padding: 32 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 12, color: '#1a1a2e',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { fontSize: 15, color: '#1a1a2e' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#999' },
  createBtn: { backgroundColor: '#6C5CE7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#fff', fontWeight: '600' },
});
