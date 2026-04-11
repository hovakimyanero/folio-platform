import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Label, Button } from '../components/ui';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Shield, Users, Flag, BarChart3, Ban, Star, Trophy, Plus, Trash2, Edit3, Award, Bookmark } from 'lucide-react';

export default function AdminPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [picks, setPicks] = useState([]);
  const [badges, setBadges] = useState([]);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', rules: '', deadline: '' });
  const [newPickId, setNewPickId] = useState('');
  const [newPickNote, setNewPickNote] = useState('');
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: '' });

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setAnalytics(data)).catch(() => {});
    api.get('/admin/reports').then(({ data }) => setReports(data.reports)).catch(() => {});
    api.get('/admin/users').then(({ data }) => setUsers(data.users)).catch(() => {});
    api.get('/admin/challenges').then(({ data }) => setChallenges(data.challenges)).catch(() => {});
    api.get('/admin/weekly-picks').then(({ data }) => setPicks(data.picks)).catch(() => {});
    api.get('/admin/badges').then(({ data }) => setBadges(data.badges)).catch(() => {});
  }, []);

  const banUser = async (userId) => {
    try { await api.post(`/admin/ban/${userId}`); showToast('Пользователь заблокирован', 'success'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u)); } catch {}
  };

  const createChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.title || !newChallenge.description || !newChallenge.deadline) return;
    try {
      const { data } = await api.post('/admin/challenges', newChallenge);
      setChallenges(prev => [data.challenge, ...prev]);
      setNewChallenge({ title: '', description: '', rules: '', deadline: '' });
      showToast('Челлендж создан', 'success');
    } catch { showToast('Ошибка создания', 'error'); }
  };

  const deleteChallenge = async (id) => {
    if (!confirm('Удалить челлендж?')) return;
    try {
      await api.delete(`/admin/challenges/${id}`);
      setChallenges(prev => prev.filter(c => c.id !== id));
      showToast('Удалён', 'success');
    } catch { showToast('Ошибка', 'error'); }
  };

  const toggleChallenge = async (id, isActive) => {
    try {
      await api.patch(`/admin/challenges/${id}`, { isActive: !isActive });
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c));
    } catch {}
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <Shield size={24} color="var(--accent)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Админ-панель</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 40, width: 'fit-content' }}>
            {[['analytics', 'Аналитика', BarChart3], ['reports', 'Жалобы', Flag], ['users', 'Пользователи', Users], ['challenges', 'Челленджи', Trophy], ['picks', 'Выбор недели', Award], ['badges', 'Бейджи', Star]].map(([val, label, Icon]) => (
              <TabsTrigger key={val} value={val} style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === val ? 'var(--text)' : 'var(--text-3)', background: tab === val ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Icon size={14} /> {label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="analytics">
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[['Пользователи', analytics.users], ['Проекты', analytics.projects], ['Просмотры', analytics.views], ['Лайки', analytics.likes], ['Новые за неделю', analytics.newUsersWeek], ['Проекты за неделю', analytics.newProjectsWeek]].map(([label, val]) => (
                  <div key={label} style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{val?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? <div className="empty-state"><h3 className="empty-state-title">Нет жалоб</h3></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ padding: 20, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{r.reason}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>от @{r.reporter?.username} · {new Date(r.createdAt).toLocaleDateString('ru')}</div></div>
                    <div style={{ display: 'flex', gap: 8 }}><Button variant="ghost" size="sm" onClick={() => api.patch(`/admin/reports/${r.id}`, { status: 'DISMISSED' })}>Отклонить</Button><Button variant="primary" size="sm" onClick={() => api.patch(`/admin/reports/${r.id}`, { status: 'RESOLVED' })}>Решить</Button></div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ padding: '14px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={u.avatar} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--glass-border)' }} alt="" />
                    <div><div style={{ fontWeight: 500, fontSize: 14 }}>{u.displayName || u.username} {u.isBanned && <span style={{ color: '#ff6b6b', fontSize: 11 }}>(забанен)</span>}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{u.username} · {u._count?.projects} проектов</div></div>
                  </div>
                  {!u.isBanned && <Button variant="ghost" size="sm" onClick={() => banUser(u.id)} style={{ color: '#ff6b6b' }}><Ban size={12} /> Забанить</Button>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges">
            {/* Create new challenge */}
            <form onSubmit={createChallenge} style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--card)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Новый челлендж</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><Label>Название</Label><Input value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} placeholder="Название челленджа" /></div>
                <div><Label>Дедлайн</Label><Input type="datetime-local" value={newChallenge.deadline} onChange={e => setNewChallenge(p => ({ ...p, deadline: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><Label>Описание</Label><Textarea rows={3} value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} placeholder="Описание челленджа" style={{ resize: 'vertical' }} /></div>
              <div style={{ marginBottom: 16 }}><Label>Правила</Label><Textarea rows={2} value={newChallenge.rules} onChange={e => setNewChallenge(p => ({ ...p, rules: e.target.value }))} placeholder="Правила (необязательно)" style={{ resize: 'vertical' }} /></div>
              <Button variant="primary" type="submit">Создать</Button>
            </form>

            {/* Challenge list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {challenges.map(c => (
                <div key={c.id} style={{ padding: 20, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.title}
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.isActive ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,107,0.1)', color: c.isActive ? '#00ff88' : '#ff6b6b' }}>{c.isActive ? 'Активен' : 'Завершён'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c._count?.entries || 0} участников · дедлайн {new Date(c.deadline).toLocaleDateString('ru')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => toggleChallenge(c.id, c.isActive)}>{c.isActive ? 'Завершить' : 'Активировать'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteChallenge(c.id)} style={{ color: '#ff6b6b' }}><Trash2 size={12} /></Button>
                  </div>
                </div>
              ))}
              {challenges.length === 0 && <div className="empty-state"><h3 className="empty-state-title">Нет челленджей</h3></div>}
            </div>
          </TabsContent>

          {/* Weekly Picks Tab */}
          <TabsContent value="picks">
            <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--card)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={16} /> Добавить в выбор недели</h3>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <Input value={newPickId} onChange={e => setNewPickId(e.target.value)} placeholder="ID проекта" style={{ flex: 1 }} />
                <Input value={newPickNote} onChange={e => setNewPickNote(e.target.value)} placeholder="Заметка куратора" style={{ flex: 2 }} />
              </div>
              <Button variant="primary" onClick={async () => {
                if (!newPickId) return;
                try {
                  const { data } = await api.post('/admin/weekly-picks', { projectId: newPickId, curatorNote: newPickNote });
                  setPicks(prev => [data.pick, ...prev]);
                  setNewPickId(''); setNewPickNote('');
                  showToast('Добавлено в выбор недели', 'success');
                } catch { showToast('Ошибка', 'error'); }
              }}>Добавить</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {picks.map(pk => (
                <div key={pk.id} style={{ padding: 20, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {pk.project?.cover && <img src={pk.project.cover} style={{ width: 48, height: 36, borderRadius: 4, objectFit: 'cover' }} alt="" />}
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{pk.project?.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>от {pk.project?.author?.displayName} {pk.curatorNote && `· "${pk.curatorNote}"`}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try { await api.delete(`/admin/weekly-picks/${pk.id}`); setPicks(prev => prev.filter(p => p.id !== pk.id)); showToast('Удалено', 'success'); } catch {}
                  }} style={{ color: '#ff6b6b' }}><Trash2 size={12} /></Button>
                </div>
              ))}
              {picks.length === 0 && <div className="empty-state"><h3 className="empty-state-title">Нет выбранных проектов</h3></div>}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--card)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Star size={16} /> Создать бейдж</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input value={newBadge.name} onChange={e => setNewBadge(p => ({ ...p, name: e.target.value }))} placeholder="Название" />
                <Input value={newBadge.description} onChange={e => setNewBadge(p => ({ ...p, description: e.target.value }))} placeholder="Описание" />
                <Input value={newBadge.icon} onChange={e => setNewBadge(p => ({ ...p, icon: e.target.value }))} placeholder="Иконка (emoji)" />
              </div>
              <Button variant="primary" onClick={async () => {
                if (!newBadge.name) return;
                try {
                  const { data } = await api.post('/admin/badges', newBadge);
                  setBadges(prev => [...prev, data.badge]);
                  setNewBadge({ name: '', description: '', icon: '' });
                  showToast('Бейдж создан', 'success');
                } catch { showToast('Ошибка', 'error'); }
              }}>Создать</Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {badges.map(b => (
                <div key={b.id} style={{ padding: 20, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon || '🏆'}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{b.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b._count?.users || 0} получили</div>
                </div>
              ))}
            </div>
            {badges.length === 0 && <div className="empty-state"><h3 className="empty-state-title">Нет бейджей</h3></div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
