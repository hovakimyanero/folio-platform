import { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Shield, Users, Flag, BarChart3, Ban, Star } from 'lucide-react';

export default function AdminPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setAnalytics(data)).catch(() => {});
    api.get('/admin/reports').then(({ data }) => setReports(data.reports)).catch(() => {});
    api.get('/admin/users').then(({ data }) => setUsers(data.users)).catch(() => {});
  }, []);

  const banUser = async (userId) => {
    try { await api.post(`/admin/ban/${userId}`); showToast('Пользователь заблокирован', 'success'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u)); } catch {}
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <Shield size={24} color="var(--accent)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Админ-панель</h1>
        </div>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 40, width: 'fit-content' }}>
            {[['analytics', 'Аналитика', BarChart3], ['reports', 'Жалобы', Flag], ['users', 'Пользователи', Users]].map(([val, label, Icon]) => (
              <Tabs.Trigger key={val} value={val} style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === val ? 'var(--text)' : 'var(--text-3)', background: tab === val ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Icon size={14} /> {label}</Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="analytics">
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
          </Tabs.Content>

          <Tabs.Content value="reports">
            {reports.length === 0 ? <div className="empty-state"><h3 className="empty-state-title">Нет жалоб</h3></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ padding: 20, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{r.reason}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>от @{r.reporter?.username} · {new Date(r.createdAt).toLocaleDateString('ru')}</div></div>
                    <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-ghost btn-sm" onClick={() => api.patch(`/admin/reports/${r.id}`, { status: 'DISMISSED' })}>Отклонить</button><button className="btn btn-primary btn-sm" onClick={() => api.patch(`/admin/reports/${r.id}`, { status: 'RESOLVED' })}>Решить</button></div>
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="users">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ padding: '14px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={u.avatar} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--glass-border)' }} alt="" />
                    <div><div style={{ fontWeight: 500, fontSize: 14 }}>{u.displayName || u.username} {u.isBanned && <span style={{ color: '#ff6b6b', fontSize: 11 }}>(banned)</span>}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{u.username} · {u._count?.projects} projects</div></div>
                  </div>
                  {!u.isBanned && <button className="btn btn-ghost btn-sm" onClick={() => banUser(u.id)} style={{ color: '#ff6b6b' }}><Ban size={12} /> Ban</button>}
                </div>
              ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
