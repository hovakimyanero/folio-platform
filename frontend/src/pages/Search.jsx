import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import api from '../utils/api';
import { Search as SearchIcon, Heart, Eye } from 'lucide-react';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState('projects');

  useEffect(() => { if (q) { setQuery(q); doSearch(q); } }, [q]);

  const doSearch = async (term) => {
    if (!term.trim()) return;
    try {
      const { data } = await api.get(`/projects?tag=${encodeURIComponent(term)}&limit=20`);
      setResults(data.projects);
    } catch { setResults([]); }
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 32 }}>Поиск</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={16} color="var(--text-3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="input" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch(query)} placeholder="Проекты, авторы, теги..." style={{ paddingLeft: 44 }} />
          </div>
          <button className="btn btn-primary" onClick={() => doSearch(query)}>Найти</button>
        </div>
        {results.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">{q ? 'Ничего не найдено' : 'Начните поиск'}</h3>
            <p className="empty-state-text">{q ? 'Попробуйте другие ключевые слова.' : 'Введите запрос для поиска проектов и авторов.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {results.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.author?.displayName}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
