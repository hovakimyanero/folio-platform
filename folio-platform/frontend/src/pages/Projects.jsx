import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import api from '../utils/api';
import { LayoutGrid, Heart, Eye } from 'lucide-react';

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'recent';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/projects?sort=${sort}&page=${page}&limit=20`)
      .then(({ data }) => { setProjects(data.projects); setTotal(data.pagination.total); })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [sort, page]);

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-0.04em', marginBottom: 40 }}>
          Проекты
        </h1>

        <Tabs.Root value={sort} onValueChange={v => { setSearchParams({ sort: v }); setPage(1); }}>
          <Tabs.List style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 48, width: 'fit-content' }}>
            {[['recent', 'Новые'], ['trending', 'В тренде'], ['popular', 'Популярные'], ['featured', 'Избранные']].map(([val, label]) => (
              <Tabs.Trigger key={val} value={val} style={{
                padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                color: sort === val ? 'var(--text)' : 'var(--text-3)',
                background: sort === val ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
              }}>
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        {projects.length === 0 && !loading ? (
          <div className="empty-state">
            <LayoutGrid size={64} color="var(--text-3)" style={{ opacity: 0.2, margin: '0 auto 24px' }} />
            <h3 className="empty-state-title">Здесь пока пусто</h3>
            <p className="empty-state-text">Станьте первым, кто опубликует проект в этой категории.</p>
            <Link to="/upload" className="btn btn-primary">Загрузить проект</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                background: 'var(--card)', border: '1px solid var(--glass-border)',
                transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
              }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img src={p.cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.author?.displayName}</span>
                    <span style={{ display: 'flex', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={11} /> {p.likeCount}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11} /> {p.viewCount}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
