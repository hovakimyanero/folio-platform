import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function CollectionDetail() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  useEffect(() => { api.get(`/collections/${id}`).then(({ data }) => setCollection(data.collection)).catch(() => {}); }, [id]);
  if (!collection) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка...</div>;

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 8 }}>{collection.name}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 48 }}>{collection.items?.length || 0} проектов · {collection.user?.displayName}</p>
        {(!collection.items || collection.items.length === 0) ? (
          <div className="empty-state"><h3 className="empty-state-title">Коллекция пуста</h3><p className="empty-state-text">Добавляйте проекты из страниц проектов.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {collection.items.map(item => (
              <Link key={item.id} to={`/projects/${item.project.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                <img src={item.project.cover} alt={item.project.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div style={{ padding: 14 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{item.project.title}</div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
