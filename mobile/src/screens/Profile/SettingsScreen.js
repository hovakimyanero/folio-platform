import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, apiJson } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Профиль', 'Пароль', 'Уведомления', 'Приватность'];

export default function SettingsScreen({ navigation }) {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Профиль');

  // Profile fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [specialization, setSpecialization] = useState(user?.specialization?.join(', ') || '');
  const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
  const [openToWork, setOpenToWork] = useState(user?.openToWork || false);
  const [openToHire, setOpenToHire] = useState(user?.openToHire || false);
  const [experience, setExperience] = useState(user?.experience || []);
  const [education, setEducation] = useState(user?.education || []);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification prefs
  const defaultPrefs = { likes: true, comments: true, follows: true, messages: true, saves: true };
  const [notifPrefs, setNotifPrefs] = useState({ ...defaultPrefs, ...(user?.notificationPrefs || {}) });
  const [savingNotifs, setSavingNotifs] = useState(false);

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
      formData.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('specialization', JSON.stringify(specialization.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('languages', JSON.stringify(languages.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('experience', JSON.stringify(experience));
      formData.append('education', JSON.stringify(education));

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

  // Experience helpers
  const addExperience = () => {
    setExperience(prev => [...prev, { company: '', role: '', from: '', to: '', current: false, description: '' }]);
  };
  const updateExp = (idx, field, value) => {
    setExperience(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };
  const removeExp = (idx) => setExperience(prev => prev.filter((_, i) => i !== idx));

  // Education helpers
  const addEducation = () => {
    setEducation(prev => [...prev, { school: '', degree: '', from: '', to: '' }]);
  };
  const updateEdu = (idx, field, value) => {
    setEducation(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };
  const removeEdu = (idx) => setEducation(prev => prev.filter((_, i) => i !== idx));

  // Password change
  const changePassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('Ошибка', 'Заполните все поля');
    if (newPassword !== confirmPassword) return Alert.alert('Ошибка', 'Пароли не совпадают');
    if (newPassword.length < 6) return Alert.alert('Ошибка', 'Минимум 6 символов');
    setSavingPassword(true);
    try {
      const resp = await api('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'Ошибка');
      Alert.alert('Готово', 'Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
    setSavingPassword(false);
  };

  // Notification prefs save
  const saveNotifPrefs = async () => {
    setSavingNotifs(true);
    try {
      const resp = await api('/users/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifPrefs),
      });
      if (!resp.ok) throw new Error('Ошибка');
      Alert.alert('Готово', 'Настройки уведомлений сохранены');
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
    setSavingNotifs(false);
  };

  // Data export
  const exportData = async () => {
    try {
      const data = await apiJson('/users/me/export');
      Alert.alert('Экспорт данных', 'Данные отправлены на вашу почту');
    } catch {
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    }
  };

  // Delete account
  const deleteAccount = () => {
    Alert.alert(
      'Удалить аккаунт',
      'Это действие необратимо. Все ваши данные будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить', style: 'destructive', onPress: async () => {
            try {
              await api('/users/me', { method: 'DELETE' });
              logout();
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить аккаунт');
            }
          }
        },
      ]
    );
  };

  const renderProfileTab = () => (
    <View>
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

      <Text style={styles.label}>Навыки (через запятую)</Text>
      <TextInput style={styles.input} value={skills} onChangeText={setSkills}
        placeholder="Figma, UI Design, Illustration..." placeholderTextColor="#999" />

      <Text style={styles.label}>Специализация (через запятую)</Text>
      <TextInput style={styles.input} value={specialization} onChangeText={setSpecialization}
        placeholder="Web Design, Mobile Apps..." placeholderTextColor="#999" />

      <Text style={styles.label}>Языки (через запятую)</Text>
      <TextInput style={styles.input} value={languages} onChangeText={setLanguages}
        placeholder="Русский, English..." placeholderTextColor="#999" />

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Ищу работу</Text>
          <Text style={{ fontSize: 12, color: '#999' }}>Показать на профиле</Text>
        </View>
        <Switch value={openToWork} onValueChange={setOpenToWork} trackColor={{ true: '#10b981' }} />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Нанимаю</Text>
          <Text style={{ fontSize: 12, color: '#999' }}>Показать на профиле</Text>
        </View>
        <Switch value={openToHire} onValueChange={setOpenToHire} trackColor={{ true: '#6366f1' }} />
      </View>

      {/* Experience */}
      <View style={styles.sectionBlock}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.sectionLabel}>Опыт работы</Text>
          <TouchableOpacity onPress={addExperience}>
            <Ionicons name="add-circle" size={28} color="#6C5CE7" />
          </TouchableOpacity>
        </View>
        {experience.map((exp, i) => (
          <View key={i} style={styles.subCard}>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeExp(i)}>
              <Ionicons name="close-circle" size={22} color="#e74c3c" />
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Компания" placeholderTextColor="#999"
              value={exp.company} onChangeText={v => updateExp(i, 'company', v)} />
            <TextInput style={styles.input} placeholder="Должность" placeholderTextColor="#999"
              value={exp.role} onChangeText={v => updateExp(i, 'role', v)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="С (2020)" placeholderTextColor="#999"
                value={exp.from} onChangeText={v => updateExp(i, 'from', v)} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="По (2024)" placeholderTextColor="#999"
                value={exp.to} onChangeText={v => updateExp(i, 'to', v)} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Switch value={exp.current || false} onValueChange={v => updateExp(i, 'current', v)}
                trackColor={{ true: '#10b981' }} />
              <Text style={{ fontSize: 13, color: '#666' }}>По настоящее время</Text>
            </View>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Описание" placeholderTextColor="#999"
              value={exp.description} onChangeText={v => updateExp(i, 'description', v)} multiline />
          </View>
        ))}
      </View>

      {/* Education */}
      <View style={styles.sectionBlock}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={styles.sectionLabel}>Образование</Text>
          <TouchableOpacity onPress={addEducation}>
            <Ionicons name="add-circle" size={28} color="#6C5CE7" />
          </TouchableOpacity>
        </View>
        {education.map((edu, i) => (
          <View key={i} style={styles.subCard}>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeEdu(i)}>
              <Ionicons name="close-circle" size={22} color="#e74c3c" />
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Учебное заведение" placeholderTextColor="#999"
              value={edu.school} onChangeText={v => updateEdu(i, 'school', v)} />
            <TextInput style={styles.input} placeholder="Степень / Специальность" placeholderTextColor="#999"
              value={edu.degree} onChangeText={v => updateEdu(i, 'degree', v)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="С (2016)" placeholderTextColor="#999"
                value={edu.from} onChangeText={v => updateEdu(i, 'from', v)} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="По (2020)" placeholderTextColor="#999"
                value={edu.to} onChangeText={v => updateEdu(i, 'to', v)} />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Сохранить</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderPasswordTab = () => (
    <View>
      <Text style={styles.label}>Текущий пароль</Text>
      <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword}
        placeholder="Текущий пароль" placeholderTextColor="#999" secureTextEntry />

      <Text style={styles.label}>Новый пароль</Text>
      <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword}
        placeholder="Новый пароль (мин. 6 символов)" placeholderTextColor="#999" secureTextEntry />

      <Text style={styles.label}>Подтвердите пароль</Text>
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
        placeholder="Повторите новый пароль" placeholderTextColor="#999" secureTextEntry />

      <TouchableOpacity style={styles.saveBtn} onPress={changePassword} disabled={savingPassword}>
        {savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Сменить пароль</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderNotificationsTab = () => (
    <View>
      {[
        { key: 'likes', label: 'Лайки', desc: 'Когда кто-то лайкнул вашу работу' },
        { key: 'comments', label: 'Комментарии', desc: 'Новые комментарии к работам' },
        { key: 'follows', label: 'Подписки', desc: 'Когда кто-то подписался на вас' },
        { key: 'messages', label: 'Сообщения', desc: 'Новые личные сообщения' },
        { key: 'saves', label: 'Сохранения', desc: 'Когда кто-то сохранил вашу работу' },
      ].map(item => (
        <View key={item.key} style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={{ fontSize: 12, color: '#999' }}>{item.desc}</Text>
          </View>
          <Switch
            value={notifPrefs[item.key] ?? true}
            onValueChange={() => setNotifPrefs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
            trackColor={{ true: '#6C5CE7' }}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={saveNotifPrefs} disabled={savingNotifs}>
        {savingNotifs ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Сохранить</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderPrivacyTab = () => (
    <View>
      <TouchableOpacity style={styles.privacyBtn} onPress={exportData}>
        <Ionicons name="download-outline" size={20} color="#6C5CE7" />
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Экспорт данных</Text>
          <Text style={styles.privacyDesc}>Скачать все ваши данные</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.privacyBtn, { borderColor: '#fee2e2' }]} onPress={deleteAccount}>
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.privacyTitle, { color: '#e74c3c' }]}>Удалить аккаунт</Text>
          <Text style={styles.privacyDesc}>Безвозвратно удалить все данные</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.form}>
        {activeTab === 'Профиль' && renderProfileTab()}
        {activeTab === 'Пароль' && renderPasswordTab()}
        {activeTab === 'Уведомления' && renderNotificationsTab()}
        {activeTab === 'Приватность' && renderPrivacyTab()}

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
  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#6C5CE7' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#666' },
  tabTextActive: { color: '#fff' },
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
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  sectionBlock: { marginTop: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  subCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#eee', position: 'relative',
  },
  removeBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  saveBtn: {
    backgroundColor: '#6C5CE7', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  privacyDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  logoutText: { fontSize: 16, color: '#e74c3c', fontWeight: '500' },
});
