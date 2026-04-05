import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function CategoryPage() {
  const { slug } = useParams();
  const [projects, setProjects] = useState([]);
  useEffect(() => { api.get(`/projects?category=${slug}&limit=20`).then(({ data }) => setProjects(data.projects)).catch(() => {}); }, [slug]);

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 48, textTransform: 'capitalize' }}>{slug.replace(/-/g, ' ')}</h1>
        {projects.length === 0 ? (
          <div className="empty-state"><h3 className="empty-state-title">Пока пусто</h3><p className="empty-state-text">В этой категории ещё нет проектов. Вы можете стать первым!</p><Link to="/upload" className="btn btn-primary">Загрузить проект</Link></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div style={{ padding: 14 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{p.author?.displayName}</div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
