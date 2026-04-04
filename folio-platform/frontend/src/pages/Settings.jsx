import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, Upload } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('bio', bio);
      formData.append('website', website);
      formData.append('location', location);
      formData.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)));
      await updateProfile(formData);
      showToast('Профиль обновлён', 'success');
    } catch { showToast('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  };

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
              <div><label className="input-label">Имя</label><input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
              <div><label className="input-label">О себе</label><textarea className="input" rows={4} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} /></div>
              <div><label className="input-label">Сайт</label><input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
              <div><label className="input-label">Местоположение</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} /></div>
              <div><label className="input-label">Навыки (через запятую)</label><input className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="UI/UX, Branding, 3D" /></div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}><Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </Tabs.Content>
          <Tabs.Content value="password"><div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><div><label className="input-label">Текущий пароль</label><input className="input" type="password" /></div><div><label className="input-label">Новый пароль</label><input className="input" type="password" /></div><div><label className="input-label">Подтвердите пароль</label><input className="input" type="password" /></div><button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Обновить пароль</button></div></Tabs.Content>
          <Tabs.Content value="notifications"><div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{['Лайки', 'Комментарии', 'Подписки', 'Сообщения'].map(n => (<div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}><span style={{ fontSize: 14 }}>{n}</span><Switch.Root defaultChecked style={{ width: 42, height: 24, borderRadius: 100, background: 'var(--card)', border: '1px solid var(--glass-border)', position: 'relative', cursor: 'pointer' }}><Switch.Thumb style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', transition: 'transform 0.2s', transform: 'translateX(2px)' }} /></Switch.Root></div>))}</div></Tabs.Content>
          <Tabs.Content value="privacy"><p style={{ fontSize: 14, color: 'var(--text-2)' }}>Настройки приватности будут доступны в ближайшем обновлении.</p></Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
