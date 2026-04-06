import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

const CATEGORIES = [
  'Графический дизайн', 'UI/UX', 'Иллюстрация', '3D',
  'Моушн-дизайн', 'Фотография', 'Веб-дизайн', 'Брендинг',
];

export default function UploadScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const handleUpload = async () => {
    if (!title || images.length === 0 || !category) {
      return Alert.alert('Ошибка', 'Заполните название, выберите изображения и категорию');
    }
    setUploading(true);
    try {
      // 1. Presign
      const files = images.map((img, i) => ({
        filename: `image_${i}.jpg`,
        contentType: 'image/jpeg',
      }));
      setProgress('Получение URL...');
      const presignData = await apiJson('/projects/presign', {
        method: 'POST',
        body: { files },
      });
      const uploads = presignData.uploads;

      // 2. Upload to S3
      const urls = [];
      for (let i = 0; i < uploads.length; i++) {
        setProgress(`Загрузка ${i + 1} из ${uploads.length}...`);
        const img = images[i];
        const resp = await fetch(img.uri);
        const blob = await resp.blob();
        await fetch(uploads[i].uploadUrl, { method: 'PUT', body: blob });
        urls.push(uploads[i].fileUrl);
      }

      // 3. Create project
      setProgress('Создание проекта...');
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const project = await apiJson('/projects/create', {
        method: 'POST',
        body: {
          title,
          description,
          category,
          tags: tagList,
          mediaUrls: urls,
          coverUrl: urls[coverIdx] || urls[0],
        },
      });
      setCreatedId(project.id);
      setSuccess(true);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось загрузить');
    }
    setUploading(false);
  };

  const reset = () => {
    setSuccess(false);
    setImages([]);
    setCoverIdx(0);
    setTitle('');
    setDescription('');
    setCategory('');
    setTags('');
    setCreatedId(null);
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#6C5CE7" />
        <Text style={styles.successTitle}>Проект загружен!</Text>
        {createdId && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ProjectDetail', { id: createdId })}
          >
            <Text style={styles.buttonText}>Посмотреть</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.button, styles.outlineBtn]} onPress={reset}>
          <Text style={styles.outlineBtnText}>Загрузить ещё</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Загрузить проект</Text>
      </View>

      <View style={styles.form}>
        {/* Image picker */}
        <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
          <Ionicons name="images" size={24} color="#6C5CE7" />
          <Text style={styles.pickText}>
            {images.length === 0 ? 'Выбрать изображения' : `${images.length} выбрано`}
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setCoverIdx(i)}>
                <Image source={{ uri: img.uri }} style={[styles.thumb, coverIdx === i && styles.thumbActive]} />
                {coverIdx === i && (
                  <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Обл.</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput style={styles.input} placeholder="Название *" placeholderTextColor="#999"
          value={title} onChangeText={setTitle} />
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Описание" placeholderTextColor="#999"
          value={description} onChangeText={setDescription} multiline />

        {/* Category */}
        <Text style={styles.label}>Категория *</Text>
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Теги (через запятую)" placeholderTextColor="#999"
          value={tags} onChangeText={setTags} />

        <TouchableOpacity
          style={[styles.button, (!title || images.length === 0 || !category || uploading) && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={!title || images.length === 0 || !category || uploading}
        >
          {uploading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>{progress}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Опубликовать</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  form: { padding: 16 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#6C5CE7', borderStyle: 'dashed', borderRadius: 12,
    padding: 16, marginBottom: 12, gap: 8,
  },
  pickText: { fontSize: 15, color: '#6C5CE7', fontWeight: '500' },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 8 },
  thumbActive: { borderWidth: 2, borderColor: '#6C5CE7' },
  coverBadge: {
    position: 'absolute', top: 4, right: 12, backgroundColor: '#6C5CE7',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 12, backgroundColor: '#fff', color: '#1a1a2e',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  catChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  catText: { fontSize: 13, color: '#666' },
  catTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6C5CE7', marginTop: 12 },
  outlineBtnText: { color: '#6C5CE7', fontSize: 16, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginTop: 16, marginBottom: 24 },
});
