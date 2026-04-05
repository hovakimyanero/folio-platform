import { useState, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, Upload, Camera } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [specialization, setSpecialization] = useState(user?.specialization?.join(', ') || '');
  const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ? user.birthDate.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [coverPreview, setCoverPreview] = useState(user?.cover || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const defaultPrefs = { likes: true, comments: true, follows: true, messages: true };
  const [notifPrefs, setNotifPrefs] = useState(() => ({ ...defaultPrefs, ...(user?.notificationPrefs || {}) }));
  const [savingNotifs, setSavingNotifs] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('bio', bio);
      formData.append('website', website);
      formData.append('location', location);
      formData.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('specialization', JSON.stringify(specialization.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('languages', JSON.stringify(languages.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('birthDate', birthDate || '');
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('cover', coverFile);
      await updateProfile(formData);
      setAvatarFile(null);
      setCoverFile(null);
      showToast('Профиль обновлён', 'success');
    } catch { showToast('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  };

  const saveNotifPrefs = async () => {
    setSavingNotifs(true);
    try {
      await api.patch('/users/me/notifications', notifPrefs);
      showToast('Настройки уведомлений сохранены', 'success');
    } catch { showToast('Ошибка сохранения', 'error'); }
    finally { setSavingNotifs(false); }
  };

  const togglePref = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const switchStyle = (checked) => ({
    width: 42, height: 24, borderRadius: 100, position: 'relative', cursor: 'pointer',
    background: checked ? 'var(--accent)' : 'var(--card)',
    border: `1px solid ${checked ? 'var(--accent)' : 'var(--glass-border)'}`,
    transition: 'background 0.2s',
  });

  const thumbStyle = (checked) => ({
    display: 'block', width: 18, height: 18, borderRadius: '50%',
    background: 'white', transition: 'transform 0.2s',
    transform: checked ? 'translateX(20px)' : 'translateX(2px)',
  });

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 40 }}>Настройки</h1>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 40, width: 'fit-content' }}>
            {[['profile', 'Профиль'], ['password', 'Пароль'], ['notifications', 'Уведомления'], ['privacy', 'Приватность']].map(([val, label]) => (
              <Tabs.Trigger key={val} value={val} style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === val ? 'var(--text)' : 'var(--text-3)', background: tab === val ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>{label}</Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="profile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Cover upload */}
              <div>
                <label className="input-label">Обложка профиля</label>
                <div
                  onClick={() => coverRef.current?.click()}
                  style={{
                    height: 160, borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                    background: coverPreview ? `url(${coverPreview}) center/cover` : 'linear-gradient(135deg, var(--card), var(--surface))',
                    border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'opacity 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 12 }}>
                    <Camera size={20} color="white" />
                  </div>
                </div>
                <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
              </div>

              {/* Avatar upload */}
              <div>
                <label className="input-label">Аватар</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    onClick={() => avatarRef.current?.click()}
                    style={{
                      width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', overflow: 'hidden',
                      background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'var(--card)',
                      border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'opacity 0.3s', flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    ) : (
                      <Camera size={20} color="var(--text-3)" />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Нажмите чтобы загрузить фото</div>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>

              <div><label className="input-label">Имя</label><input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
              <div><label className="input-label">О себе</label><textarea className="input" rows={4} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} /></div>
              <div><label className="input-label">Сайт</label><input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
              <div><label className="input-label">Местоположение</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} /></div>
              <div><label className="input-label">Навыки (через запятую)</label><input className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="UI/UX, Branding, 3D" /></div>
              <div><label className="input-label">Специализация (через запятую)</label><input className="input" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Веб-дизайн, Графический дизайн" /></div>
              <div><label className="input-label">Языки (через запятую)</label><input className="input" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Русский, English" /></div>
              <div><label className="input-label">Дата рождения</label><input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}><Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </Tabs.Content>
          <Tabs.Content value="password"><div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><div><label className="input-label">Текущий пароль</label><input className="input" type="password" /></div><div><label className="input-label">Новый пароль</label><input className="input" type="password" /></div><div><label className="input-label">Подтвердите пароль</label><input className="input" type="password" /></div><button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Обновить пароль</button></div></Tabs.Content>
          <Tabs.Content value="notifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[['likes', 'Лайки'], ['comments', 'Комментарии'], ['follows', 'Подписки'], ['messages', 'Сообщения']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <Switch.Root
                    checked={notifPrefs[key]}
                    onCheckedChange={() => togglePref(key)}
                    style={switchStyle(notifPrefs[key])}
                  >
                    <Switch.Thumb style={thumbStyle(notifPrefs[key])} />
                  </Switch.Root>
                </div>
              ))}
              <button className="btn btn-primary" onClick={saveNotifPrefs} disabled={savingNotifs} style={{ alignSelf: 'flex-start', marginTop: 8, opacity: savingNotifs ? 0.6 : 1 }}>
                <Save size={14} /> {savingNotifs ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </Tabs.Content>
          <Tabs.Content value="privacy">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Экспорт данных</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Скачайте копию всех ваших данных (профиль, проекты, комментарии).</p>
                <button className="btn btn-secondary" onClick={async () => {
                  try {
                    const { data } = await api.get('/users/me/export');
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'folio-data-export.json'; a.click();
                    URL.revokeObjectURL(url);
                    showToast('Данные экспортированы', 'success');
                  } catch { showToast('Ошибка экспорта', 'error'); }
                }}>Скачать мои данные</button>
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#ff6b6b' }}>Удаление аккаунта</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Это действие необратимо. Все ваши данные, проекты и комментарии будут удалены.</p>
                <button className="btn btn-ghost" style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={async () => {
                  if (!confirm('Вы уверены? Все данные будут удалены безвозвратно.')) return;
                  if (!confirm('Это последнее предупреждение. Удалить аккаунт навсегда?')) return;
                  try {
                    await api.delete('/users/me');
                    showToast('Аккаунт удалён', 'success');
                    window.location.href = '/';
                  } catch { showToast('Ошибка удаления', 'error'); }
                }}>Удалить мой аккаунт</button>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
