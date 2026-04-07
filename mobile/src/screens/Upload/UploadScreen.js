import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Switch, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiJson } from '../../services/api';

const CATEGORIES = [
  'Графический дизайн', 'UI/UX', 'Иллюстрация', '3D',
  'Моушн-дизайн', 'Фотография', 'Веб-дизайн', 'Брендинг',
];

const BLOCK_TYPES = [
  { type: 'TEXT', label: 'Текст', icon: 'document-text' },
  { type: 'HEADING', label: 'Заголовок', icon: 'text' },
  { type: 'IMAGE', label: 'Изображение', icon: 'image' },
  { type: 'QUOTE', label: 'Цитата', icon: 'chatbox-ellipses' },
  { type: 'CODE', label: 'Код', icon: 'code-slash' },
  { type: 'DIVIDER', label: 'Разделитель', icon: 'remove' },
  { type: 'EMBED', label: 'Embed', icon: 'globe' },
  { type: 'VIDEO', label: 'Видео URL', icon: 'videocam' },
];

const INDUSTRIES = ['fintech', 'healthcare', 'ecommerce', 'education', 'social', 'saas', 'gaming', 'media'];
const STYLES = ['minimal', 'brutalist', 'glassmorphism', 'neumorphism', 'flat', 'skeuomorphism', 'retro'];

export default function UploadScreen({ navigation }) {
  const [mode, setMode] = useState('gallery'); // gallery | casestudy
  const [images, setImages] = useState([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [tools, setTools] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setProjectStyle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  // Case study blocks
  const [blocks, setBlocks] = useState([]);

  // Publishing controls
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [password, setPassword] = useState('');
  const [linkOnly, setLinkOnly] = useState(false);

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

  const addBlock = (type) => {
    const newBlock = { id: Date.now().toString(), type, content: {} };
    if (type === 'TEXT') newBlock.content = { text: '' };
    else if (type === 'HEADING') newBlock.content = { text: '' };
    else if (type === 'IMAGE') newBlock.content = { url: '', caption: '' };
    else if (type === 'QUOTE') newBlock.content = { text: '', author: '' };
    else if (type === 'CODE') newBlock.content = { code: '', language: '' };
    else if (type === 'DIVIDER') newBlock.content = {};
    else if (type === 'EMBED') newBlock.content = { embedUrl: '' };
    else if (type === 'VIDEO') newBlock.content = { url: '' };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id, content) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b));
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (idx, dir) => {
    const newBlocks = [...blocks];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    setBlocks(newBlocks);
  };

  const pickBlockImage = async (blockId) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      // Upload to S3
      try {
        const presignData = await apiJson('/projects/presign', {
          method: 'POST',
          body: { files: [{ filename: 'block_img.jpg', contentType: 'image/jpeg' }] },
        });
        const upload = presignData.uploads[0];
        const resp = await fetch(result.assets[0].uri);
        const blob = await resp.blob();
        await fetch(upload.uploadUrl, { method: 'PUT', body: blob });
        updateBlock(blockId, { url: upload.fileUrl });
      } catch {
        Alert.alert('Ошибка', 'Не удалось загрузить изображение');
      }
    }
  };

  const handleUpload = async () => {
    if (!title || (mode === 'gallery' && images.length === 0) || !category) {
      return Alert.alert('Ошибка', 'Заполните название, выберите изображения и категорию');
    }
    setUploading(true);
    try {
      let urls = [];
      if (images.length > 0) {
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

        for (let i = 0; i < uploads.length; i++) {
          setProgress(`Загрузка ${i + 1} из ${uploads.length}...`);
          const img = images[i];
          const resp = await fetch(img.uri);
          const blob = await resp.blob();
          await fetch(uploads[i].uploadUrl, { method: 'PUT', body: blob });
          urls.push(uploads[i].fileUrl);
        }
      }

      setProgress('Создание проекта...');
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const toolList = tools.split(',').map(t => t.trim()).filter(Boolean);

      const body = {
        title,
        description,
        category,
        tags: tagList,
        tools: toolList,
        industry: industry || undefined,
        style: style || undefined,
        mediaUrls: urls,
        coverUrl: urls[coverIdx] || urls[0],
        isDraft,
        linkOnly,
        password: password || undefined,
        scheduledAt: scheduledAt || undefined,
      };

      if (mode === 'casestudy' && blocks.length > 0) {
        body.blocks = blocks.map((b, i) => ({ type: b.type, content: b.content, order: i }));
      }

      const project = await apiJson('/projects/create', {
        method: 'POST',
        body,
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
    setTools('');
    setIndustry('');
    setProjectStyle('');
    setBlocks([]);
    setIsDraft(false);
    setScheduledAt('');
    setPassword('');
    setLinkOnly(false);
    setCreatedId(null);
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#6C5CE7" />
        <Text style={styles.successTitle}>
          {isDraft ? 'Черновик сохранён!' : 'Проект загружен!'}
        </Text>
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

  const renderBlockEditor = (block, idx) => {
    return (
      <View key={block.id} style={styles.blockCard}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockType}>
            {BLOCK_TYPES.find(b => b.type === block.type)?.label || block.type}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => moveBlock(idx, -1)}>
              <Ionicons name="chevron-up" size={18} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveBlock(idx, 1)}>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeBlock(block.id)}>
              <Ionicons name="close" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

        {block.type === 'TEXT' && (
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Текст блока..."
            placeholderTextColor="#999"
            value={block.content.text}
            onChangeText={t => updateBlock(block.id, { text: t })}
            multiline
          />
        )}
        {block.type === 'HEADING' && (
          <TextInput
            style={styles.input}
            placeholder="Заголовок..."
            placeholderTextColor="#999"
            value={block.content.text}
            onChangeText={t => updateBlock(block.id, { text: t })}
          />
        )}
        {block.type === 'IMAGE' && (
          <View>
            {block.content.url ? (
              <Image source={{ uri: block.content.url }} style={{ height: 120, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickBlockImage(block.id)}>
                <Ionicons name="image" size={20} color="#6C5CE7" />
                <Text style={styles.pickText}>Выбрать изображение</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.input}
              placeholder="Подпись (необязательно)"
              placeholderTextColor="#999"
              value={block.content.caption}
              onChangeText={t => updateBlock(block.id, { caption: t })}
            />
          </View>
        )}
        {block.type === 'QUOTE' && (
          <View>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Текст цитаты..."
              placeholderTextColor="#999"
              value={block.content.text}
              onChangeText={t => updateBlock(block.id, { text: t })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Автор"
              placeholderTextColor="#999"
              value={block.content.author}
              onChangeText={t => updateBlock(block.id, { author: t })}
            />
          </View>
        )}
        {block.type === 'CODE' && (
          <View>
            <TextInput
              style={[styles.input, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', height: 100 }]}
              placeholder="// код..."
              placeholderTextColor="#999"
              value={block.content.code}
              onChangeText={t => updateBlock(block.id, { code: t })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Язык (js, css, etc.)"
              placeholderTextColor="#999"
              value={block.content.language}
              onChangeText={t => updateBlock(block.id, { language: t })}
            />
          </View>
        )}
        {block.type === 'EMBED' && (
          <TextInput
            style={styles.input}
            placeholder="URL (Figma, YouTube...)"
            placeholderTextColor="#999"
            value={block.content.embedUrl}
            onChangeText={t => updateBlock(block.id, { embedUrl: t })}
            autoCapitalize="none"
          />
        )}
        {block.type === 'VIDEO' && (
          <TextInput
            style={styles.input}
            placeholder="URL видео..."
            placeholderTextColor="#999"
            value={block.content.url}
            onChangeText={t => updateBlock(block.id, { url: t })}
            autoCapitalize="none"
          />
        )}
        {block.type === 'DIVIDER' && (
          <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Загрузить проект</Text>
      </View>

      <View style={styles.form}>
        {/* Mode selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'gallery' && styles.modeBtnActive]}
            onPress={() => setMode('gallery')}
          >
            <Ionicons name="images" size={18} color={mode === 'gallery' ? '#fff' : '#666'} />
            <Text style={[styles.modeText, mode === 'gallery' && styles.modeTextActive]}>Галерея</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'casestudy' && styles.modeBtnActive]}
            onPress={() => setMode('casestudy')}
          >
            <Ionicons name="document-text" size={18} color={mode === 'casestudy' ? '#fff' : '#666'} />
            <Text style={[styles.modeText, mode === 'casestudy' && styles.modeTextActive]}>Кейс-стади</Text>
          </TouchableOpacity>
        </View>

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
        <TextInput style={styles.input} placeholder="Инструменты (Figma, Photoshop...)" placeholderTextColor="#999"
          value={tools} onChangeText={setTools} />

        {/* Industry */}
        <Text style={styles.label}>Индустрия</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {INDUSTRIES.map(ind => (
              <TouchableOpacity
                key={ind}
                style={[styles.catChip, industry === ind && styles.catChipActive]}
                onPress={() => setIndustry(industry === ind ? '' : ind)}
              >
                <Text style={[styles.catText, industry === ind && styles.catTextActive]}>{ind}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Style */}
        <Text style={styles.label}>Стиль</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {STYLES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.catChip, style === s && styles.catChipActive]}
                onPress={() => setProjectStyle(style === s ? '' : s)}
              >
                <Text style={[styles.catText, style === s && styles.catTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Case study blocks */}
        {mode === 'casestudy' && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Блоки кейс-стади</Text>
            {blocks.map((block, idx) => renderBlockEditor(block, idx))}

            <Text style={[styles.label, { marginTop: 8 }]}>Добавить блок:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 8 }}>
                {BLOCK_TYPES.map(bt => (
                  <TouchableOpacity
                    key={bt.type}
                    style={styles.addBlockBtn}
                    onPress={() => addBlock(bt.type)}
                  >
                    <Ionicons name={bt.icon} size={16} color="#6C5CE7" />
                    <Text style={styles.addBlockText}>{bt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Publishing controls */}
        <View style={styles.controlsSection}>
          <Text style={[styles.label, { fontSize: 16, marginBottom: 12 }]}>Публикация</Text>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Черновик</Text>
              <Text style={styles.switchDesc}>Сохранить без публикации</Text>
            </View>
            <Switch value={isDraft} onValueChange={setIsDraft} trackColor={{ true: '#6C5CE7' }} />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Только по ссылке</Text>
              <Text style={styles.switchDesc}>Не показывать в общей ленте</Text>
            </View>
            <Switch value={linkOnly} onValueChange={setLinkOnly} trackColor={{ true: '#6C5CE7' }} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Пароль для доступа (необязательно)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Отложенная публикация (ГГГГ-ММ-ДД ЧЧ:ММ)"
            placeholderTextColor="#999"
            value={scheduledAt}
            onChangeText={setScheduledAt}
          />
        </View>

        {/* Submit buttons */}
        <TouchableOpacity
          style={[styles.button, (!title || (mode === 'gallery' && images.length === 0) || !category || uploading) && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={!title || (mode === 'gallery' && images.length === 0) || !category || uploading}
        >
          {uploading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>{progress}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              {isDraft ? 'Сохранить черновик' : 'Опубликовать'}
            </Text>
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
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#f0f0f0',
  },
  modeBtnActive: { backgroundColor: '#6C5CE7' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  modeTextActive: { color: '#fff' },
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
  // Blocks
  blockCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#eee',
  },
  blockHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  blockType: { fontSize: 12, fontWeight: '700', color: '#6C5CE7', textTransform: 'uppercase' },
  addBlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f0edff', borderWidth: 1, borderColor: '#e0d4ff',
  },
  addBlockText: { fontSize: 12, color: '#6C5CE7', fontWeight: '500' },
  // Publishing controls
  controlsSection: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  switchDesc: { fontSize: 12, color: '#999', marginTop: 2 },
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
