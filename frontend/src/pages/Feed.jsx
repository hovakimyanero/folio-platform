import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Heart, Eye, Bookmark, TrendingUp, Users, Sparkles, Clock, Award } from 'lucide-react';

const TABS = [
  { id: 'for-you', label: 'Для вас', icon: Sparkles },
  { id: 'following', label: 'Подписки', icon: Users },
  { id: 'trending', label: 'Тренды', icon: TrendingUp },
  { id: 'discover', label: 'Открытия', icon: Clock },
  { id: 'weekly-picks', label: 'Выбор недели', icon: Award },
];

export default function Feed() {
  const { user } = useAuth();
  const [tab, setTab] = useState('for-you');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [discoverSection, setDiscoverSection] = useState('new');
  const observer = useRef();

  const lastRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(p => p + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchFeed = useCallback(async (resetPage) => {
    const p = resetPage ? 1 : page;
    setLoading(true);
    try {
      let url;
      switch (tab) {
        case 'for-you': url = `/feed/for-you?page=${p}&limit=20`; break;
        case 'following': url = `/feed/following?page=${p}&limit=20`; break;
        case 'trending': url = `/feed/trending?period=${trendPeriod}&page=${p}&limit=20`; break;
        case 'discover': url = `/feed/discover?section=${discoverSection}&page=${p}&limit=20`; break;
        case 'weekly-picks': url = `/feed/weekly-picks?page=${p}&limit=20`; break;
        default: url = `/feed/for-you?page=${p}&limit=20`;
      }
      const { data } = await api.get(url);
      const items = data.projects || data.picks?.map(pk => ({ ...pk.project, curatorNote: pk.curatorNote })) || [];
      if (resetPage) {
        setProjects(items);
      } else {
        setProjects(prev => [...prev, ...items]);
      }
      setHasMore(items.length === 20);
    } catch {
      if (resetPage) setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, trendPeriod, discoverSection]);

  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);
    fetchFeed(true);
  }, [tab, trendPeriod, discoverSection]);

  useEffect(() => {
    if (page > 1) fetchFeed(false);
  }, [page]);

  // Track interaction on view
  const trackView = (projectId) => {
    if (!user) return;
    api.post('/feed/interaction', { projectId, type: 'VIEW' }).catch(() => {});
  };

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 8 }}>Лента</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 15, marginBottom: 40 }}>
          Персонализированная подборка лучших работ
        </p>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 32, width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13,
                fontWeight: 500, color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
                background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Sub-filters */}
        {tab === 'trending' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['24h', 'За сутки'], ['7d', 'За неделю'], ['30d', 'За месяц']].map(([val, label]) => (
              <button key={val} onClick={() => setTrendPeriod(val)} className={`btn btn-sm ${trendPeriod === val ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
            ))}
          </div>
        )}
        {tab === 'discover' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['new', 'Новое'], ['underrated', 'Недооценённое'], ['rising', 'Растущие']].map(([val, label]) => (
              <button key={val} onClick={() => setDiscoverSection(val)} className={`btn btn-sm ${discoverSection === val ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 && !loading ? (
          <div className="empty-state">
            <h3 className="empty-state-title">
              {tab === 'following' ? 'Подпишитесь на авторов' : 'Пока ничего нет'}
            </h3>
            <p className="empty-state-text">
              {tab === 'following'
                ? 'Здесь будут появляться работы авторов, на которых вы подписаны.'
                : 'Попробуйте другой раздел ленты.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {projects.map((p, i) => (
              <Link
                key={p.id + '-' + i}
                to={`/projects/${p.id}`}
                ref={i === projects.length - 1 ? lastRef : null}
                onMouseEnter={() => trackView(p.id)}
                style={{
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                  {p.curatorNote && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8, right: 8, padding: '8px 12px',
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                      borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-2)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Award size={12} color="var(--accent)" /> {p.curatorNote}
                    </div>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.author?.avatar && <img src={p.author.avatar} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />}
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.author?.displayName || p.author?.username}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {p.likeCount || p._count?.likes || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {p.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 14 }}>
            Загрузка...
          </div>
        )}
      </div>
    </div>
  );
}
