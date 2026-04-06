import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, setUser, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [openToWork, setOpenToWork] = useState(user?.openToWork || false);
  const [openToHire, setOpenToHire] = useState(user?.openToHire || false);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('bio', bio);
      formData.append('headline', headline);
      formData.append('website', website);
      formData.append('location', location);
      formData.append('openToWork', openToWork.toString());
      formData.append('openToHire', openToHire.toString());

      if (avatarUri) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        formData.append('avatar', {
          uri: avatarUri,
          name: `avatar.${ext}`,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
      }

      const resp = await api('/users/me', {
        method: 'PATCH',
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'Ошибка');
      setUser(prev => ({ ...prev, ...data.user }));
      Alert.alert('Готово', 'Профиль обновлён');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Выйти', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : { uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=6C5CE7&color=fff` };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Имя</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName}
          placeholder="Имя" placeholderTextColor="#999" />

        <Text style={styles.label}>Заголовок</Text>
        <TextInput style={styles.input} value={headline} onChangeText={setHeadline}
          placeholder="UI/UX дизайнер • Фрилансер" placeholderTextColor="#999" />

        <Text style={styles.label}>О себе</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio}
          placeholder="Расскажите о себе" placeholderTextColor="#999" multiline />

        <Text style={styles.label}>Сайт</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite}
          placeholder="https://example.com" placeholderTextColor="#999" autoCapitalize="none" />

        <Text style={styles.label}>Город</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation}
          placeholder="Город" placeholderTextColor="#999" />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
          <View>
            <Text style={styles.label}>Ищу работу</Text>
            <Text style={{ fontSize: 12, color: '#999' }}>Показать на профиле</Text>
          </View>
          <Switch value={openToWork} onValueChange={setOpenToWork} trackColor={{ true: '#10b981' }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
          <View>
            <Text style={styles.label}>Нанимаю</Text>
            <Text style={{ fontSize: 12, color: '#999' }}>Показать на профиле</Text>
          </View>
          <Switch value={openToHire} onValueChange={setOpenToHire} trackColor={{ true: '#6366f1' }} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Сохранить</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  form: { padding: 16 },
  avatarContainer: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 12, backgroundColor: '#fff', color: '#1a1a2e',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  logoutText: { fontSize: 16, color: '#e74c3c', fontWeight: '500' },
});
