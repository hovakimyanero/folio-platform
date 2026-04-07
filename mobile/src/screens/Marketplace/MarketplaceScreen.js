import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_W = (width - 44) / 2;

const TYPES = [
  { value: '', label: 'Все', icon: 'grid' },
  { value: 'UI_KIT', label: 'UI Kit', icon: 'layers' },
  { value: 'TEMPLATE', label: 'Шаблоны', icon: 'document' },
  { value: 'ICON_SET', label: 'Иконки', icon: 'apps' },
  { value: 'FONT', label: 'Шрифты', icon: 'text' },
  { value: 'MOCKUP', label: 'Мокапы', icon: 'phone-portrait' },
  { value: 'ILLUSTRATION', label: 'Иллюстрации', icon: 'brush' },
  { value: 'THREE_D_ASSET', label: '3D', icon: 'cube' },
  { value: 'OTHER', label: 'Другое', icon: 'ellipsis-horizontal' },
];

const SORTS = [
  { value: 'newest', label: 'Новые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'price-asc', label: 'Цена ↑' },
  { value: 'price-desc', label: 'Цена ↓' },
];

export default function MarketplaceScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (type) q.set('type', type);
      if (sort) q.set('sort', sort);
      if (search) q.set('search', search);
      q.set('limit', '24');
      const data = await apiJson(`/marketplace?${q.toString()}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [type, sort, search]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Item detail modal-like view
  if (selectedItem) {
    const item = selectedItem;
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedItem(null)}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle} numberOfLines={1}>{item.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.detailContent}>
          <Image source={{ uri: item.cover }} style={styles.detailCover} />
          <Text style={styles.detailTitle}>{item.title}</Text>
          <View style={styles.detailMeta}>
            <Text style={styles.detailPrice}>
              {item.price === 0 ? 'Бесплатно' : `$${item.price}`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="download" size={14} color="#999" />
              <Text style={styles.detailMetaText}>{item.downloads}</Text>
            </View>
            {item.rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.detailMetaText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.detailDesc}>{item.description}</Text>
          {item.seller && (
            <TouchableOpacity
              style={styles.sellerRow}
              onPress={() => {
                setSelectedItem(null);
                navigation.navigate('Profile', { username: item.seller.username });
              }}
            >
              <Image
                source={{ uri: item.seller.avatar || `https://ui-avatars.com/api/?name=${item.seller.username}&background=6C5CE7&color=fff` }}
                style={styles.sellerAvatar}
              />
              <Text style={styles.sellerName}>{item.seller.displayName || item.seller.username}</Text>
            </TouchableOpacity>
          )}
          {item.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.map((t, i) => (
                <View key={i} style={styles.tagChip}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedItem(item)}>
      <Image source={{ uri: item.cover }} style={styles.cardCover} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.cardPrice}>
            {item.price === 0 ? 'Бесплатно' : `$${item.price}`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="download" size={12} color="#999" />
            <Text style={styles.cardMeta}>{item.downloads || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#999" style={{ position: 'absolute', left: 14, zIndex: 1 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск ресурсов..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Type filter */}
      <FlatList
        horizontal
        data={TYPES}
        showsHorizontalScrollIndicator={false}
        keyExtractor={t => t.value}
        contentContainerStyle={styles.typesRow}
        renderItem={({ item: t }) => (
          <TouchableOpacity
            style={[styles.typeChip, type === t.value && styles.typeChipActive]}
            onPress={() => setType(t.value)}
          >
            <Ionicons name={t.icon} size={14} color={type === t.value ? '#fff' : '#666'} />
            <Text style={[styles.typeText, type === t.value && styles.typeTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Sort */}
      <FlatList
        horizontal
        data={SORTS}
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s.value}
        contentContainerStyle={styles.sortRow}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.sortChip, sort === s.value && styles.sortChipActive]}
            onPress={() => setSort(s.value)}
          >
            <Text style={[styles.sortText, sort === s.value && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.totalText}>{total} товаров</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Маркетплейс</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6C5CE7" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          ListHeaderComponent={ListHeader}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6C5CE7" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Нет товаров</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  searchRow: { paddingHorizontal: 12, paddingTop: 12, position: 'relative' },
  searchInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12,
    paddingLeft: 40, fontSize: 14, backgroundColor: '#fff', color: '#1a1a2e',
  },
  typesRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  typeChipActive: { backgroundColor: '#6C5CE7' },
  typeText: { fontSize: 13, fontWeight: '500', color: '#666' },
  typeTextActive: { color: '#fff' },
  sortRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0' },
  sortChipActive: { backgroundColor: '#1a1a2e' },
  sortText: { fontSize: 12, color: '#666' },
  sortTextActive: { color: '#fff' },
  totalText: { fontSize: 12, color: '#999', paddingHorizontal: 16, paddingBottom: 8 },
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardCover: { width: '100%', height: CARD_W * 0.7, backgroundColor: '#eee' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#6C5CE7' },
  cardMeta: { fontSize: 11, color: '#999' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  // Detail
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  detailHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  detailContent: { padding: 16 },
  detailCover: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#eee', marginBottom: 16 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  detailPrice: { fontSize: 20, fontWeight: '800', color: '#6C5CE7' },
  detailMetaText: { fontSize: 13, color: '#999' },
  detailDesc: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 12 },
  sellerAvatar: { width: 36, height: 36, borderRadius: 18 },
  sellerName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0edff' },
  tagText: { fontSize: 12, color: '#6C5CE7' },
});
