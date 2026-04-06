import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { BarChart3, Eye, Heart, Bookmark, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/projects?sort=recent&limit=10'),
    ]).then(([{ data: ov }, { data: proj }]) => {
      setOverview(ov);
      setProjects(proj.projects || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка...</div>;

  const stats = overview ? [
    { label: 'Просмотры', value: overview.totalViews, icon: Eye, color: '#6366f1' },
    { label: 'Лайки', value: overview.totalLikes, icon: Heart, color: '#ef4444' },
    { label: 'Сохранения', value: overview.totalSaves, icon: Bookmark, color: '#f59e0b' },
    { label: 'Подписчики', value: overview.followerCount, icon: Users, color: '#10b981' },
    { label: 'Просмотры профиля', value: overview.profileViews, icon: Eye, color: '#8b5cf6' },
    { label: 'Вовлечённость', value: `${(overview.engagementRate * 100).toFixed(1)}%`, icon: TrendingUp, color: 'var(--accent)' },
  ] : [];

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BarChart3 size={24} color="var(--accent)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Аналитика</h1>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 15, marginBottom: 40 }}>Статистика вашего портфолио</p>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 48 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              padding: 24, borderRadius: 'var(--radius-md)',
              background: 'var(--card)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top projects by views */}
        {overview?.topProjects?.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 24 }}>Лучшие проекты</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {overview.topProjects.map((p, i) => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  transition: 'background 0.2s',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-3)', width: 28 }}>
                    {i + 1}
                  </span>
                  {p.cover && <img src={p.cover} style={{ width: 56, height: 42, borderRadius: 6, objectFit: 'cover' }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {p.viewCount}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {p.likeCount}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bookmark size={12} /> {p.saveCount || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Traffic sources */}
        {overview?.trafficSources && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 24 }}>Источники трафика</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {Object.entries(overview.trafficSources).map(([source, count]) => (
                <div key={source} style={{
                  padding: 20, borderRadius: 'var(--radius-sm)',
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, textTransform: 'capitalize' }}>{source}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
