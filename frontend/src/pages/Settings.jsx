import { useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Label, Button, IconButton, Switch, Checkbox, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel, Separator } from '../components/ui';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, Upload, Camera, Briefcase, GraduationCap, Plus, X } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [specialization, setSpecialization] = useState(user?.specialization?.join(', ') || '');
  const [languages, setLanguages] = useState(user?.languages?.join(', ') || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ? user.birthDate.slice(0, 10) : '');
  const [openToWork, setOpenToWork] = useState(user?.openToWork || false);
  const [openToHire, setOpenToHire] = useState(user?.openToHire || false);
  const [experience, setExperience] = useState(user?.experience || []);
  const [education, setEducation] = useState(user?.education || []);
  const [ctaLabel, setCtaLabel] = useState(user?.customCTA?.label || '');
  const [ctaUrl, setCtaUrl] = useState(user?.customCTA?.url || '');
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
      formData.append('headline', headline);
      formData.append('openToWork', openToWork);
      formData.append('openToHire', openToHire);
      formData.append('experience', JSON.stringify(experience));
      formData.append('education', JSON.stringify(education));
      formData.append('customCTA', JSON.stringify({ label: ctaLabel, url: ctaUrl }));
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

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 40 }}>Настройки</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList style={{ marginBottom: 40, width: 'fit-content' }}>
            {[['profile', 'Профиль'], ['password', 'Пароль'], ['notifications', 'Уведомления'], ['privacy', 'Приватность']].map(([val, label]) => (
              <TabsTrigger key={val} value={val}>{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Cover upload */}
              <div>
                <Label>Обложка профиля</Label>
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
                <Label>Аватар</Label>
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

              <div><Label>Имя</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
              <div><Label>Заголовок / Headline</Label><Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Senior UI Designer at Company" /></div>
              <div><Label>О себе</Label><Textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} /></div>
              <div><Label>Сайт</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
              <div><Label>Местоположение</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
              <div><Label>Навыки (через запятую)</Label><Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="UI/UX, Branding, 3D" /></div>
              <div><Label>Специализация (через запятую)</Label><Input value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Веб-дизайн, Графический дизайн" /></div>
              <div><Label>Языки (через запятую)</Label><Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Русский, English" /></div>
              <div><Label>Дата рождения</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>

              {/* Open to work / hire */}
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <Checkbox checked={openToWork} onCheckedChange={setOpenToWork} />
                  <Briefcase size={14} /> Ищу работу
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <Checkbox checked={openToHire} onCheckedChange={setOpenToHire} />
                  <Briefcase size={14} /> Нанимаю
                </label>
              </div>

              {/* Experience */}
              <div>
                <Label>Опыт работы</Label>
                {experience.map((exp, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 12, alignItems: 'start' }}>
                    <Input placeholder="Должность" value={exp.title || ''} onChange={e => { const arr = [...experience]; arr[i] = { ...arr[i], title: e.target.value }; setExperience(arr); }} />
                    <Input placeholder="Компания" value={exp.company || ''} onChange={e => { const arr = [...experience]; arr[i] = { ...arr[i], company: e.target.value }; setExperience(arr); }} />
                    <IconButton onClick={() => setExperience(prev => prev.filter((_, idx) => idx !== i))} style={{ color: '#ff6b6b' }}><X size={14} /></IconButton>
                    <Input placeholder="Период (2020–2023)" value={exp.period || ''} onChange={e => { const arr = [...experience]; arr[i] = { ...arr[i], period: e.target.value }; setExperience(arr); }} style={{ gridColumn: '1/3' }} />
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setExperience(prev => [...prev, { title: '', company: '', period: '' }])}><Plus size={12} /> Добавить</Button>
              </div>

              {/* Education */}
              <div>
                <Label>Образование</Label>
                {education.map((edu, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 12, alignItems: 'start' }}>
                    <Input placeholder="Учебное заведение" value={edu.institution || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], institution: e.target.value }; setEducation(arr); }} />
                    <Input placeholder="Степень / Программа" value={edu.degree || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], degree: e.target.value }; setEducation(arr); }} />
                    <IconButton onClick={() => setEducation(prev => prev.filter((_, idx) => idx !== i))} style={{ color: '#ff6b6b' }}><X size={14} /></IconButton>
                    <Input placeholder="Период" value={edu.period || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], period: e.target.value }; setEducation(arr); }} style={{ gridColumn: '1/3' }} />
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setEducation(prev => [...prev, { institution: '', degree: '', period: '' }])}><Plus size={12} /> Добавить</Button>
              </div>

              {/* Custom CTA */}
              <div>
                <Label>Кнопка действия (CTA)</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input placeholder="Текст кнопки" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} />
                  <Input placeholder="URL" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
                </div>
              </div>

              <Button variant="primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}><Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
          </TabsContent>
          <TabsContent value="password"><div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><div><Label>Текущий пароль</Label><Input type="password" /></div><div><Label>Новый пароль</Label><Input type="password" /></div><div><Label>Подтвердите пароль</Label><Input type="password" /></div><Button variant="primary" style={{ alignSelf: 'flex-start' }}>Обновить пароль</Button></div></TabsContent>
          <TabsContent value="notifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[['likes', 'Лайки'], ['comments', 'Комментарии'], ['follows', 'Подписки'], ['messages', 'Сообщения']].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <Switch
                    checked={notifPrefs[key]}
                    onCheckedChange={() => togglePref(key)}
                  />
                </div>
              ))}
              <Button variant="primary" onClick={saveNotifPrefs} disabled={savingNotifs} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Save size={14} /> {savingNotifs ? 'Сохранение...' : 'Сохранить настройки'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="privacy">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Экспорт данных</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Скачайте копию всех ваших данных (профиль, проекты, комментарии).</p>
                <Button variant="secondary" onClick={async () => {
                  try {
                    const { data } = await api.get('/users/me/export');
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'folio-data-export.json'; a.click();
                    URL.revokeObjectURL(url);
                    showToast('Данные экспортированы', 'success');
                  } catch { showToast('Ошибка экспорта', 'error'); }
                }}>Скачать мои данные</Button>
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#ff6b6b' }}>Удаление аккаунта</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Это действие необратимо. Все ваши данные, проекты и комментарии будут удалены.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="danger" size="sm">Удалить мой аккаунт</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent title="Удалить аккаунт?" description="Это действие необратимо. Все ваши данные, проекты и комментарии будут удалены навсегда.">
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction className="rdx-btn rdx-btn-danger rdx-btn-sm" onClick={async () => {
                        try {
                          await api.delete('/users/me');
                          showToast('Аккаунт удалён', 'success');
                          window.location.href = '/';
                        } catch { showToast('Ошибка удаления', 'error'); }
                      }}>Удалить навсегда</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
