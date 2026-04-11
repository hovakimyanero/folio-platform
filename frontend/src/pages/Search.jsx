import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, Input, Button } from '../components/ui';
import api from '../utils/api';
import { Search as SearchIcon, Heart, Eye, Tag, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const typeParam = params.get('type') || 'projects';
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState(typeParam);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/tags/popular?limit=20').then(r => setPopularTags(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (q) { setQuery(q); doSearch(q, typeParam); }
  }, [q, typeParam]);

  const doSearch = async (term, type = tab) => {
    if (!term.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      if (type === 'projects') {
        const { data } = await api.get(`/projects?search=${encodeURIComponent(term)}&limit=30`);
        setProjects(data.projects || []);
      } else if (type === 'users') {
        const { data } = await api.get(`/users?search=${encodeURIComponent(term)}&limit=30`);
        setUsers(data.users || data || []);
      } else if (type === 'tags') {
        const { data } = await api.get(`/tags/autocomplete?q=${encodeURIComponent(term)}&limit=30`);
        setTags(data || []);
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  const handleTabChange = (val) => {
    setTab(val);
    if (query.trim()) doSearch(query, val);
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= 2) {
      try {
        const { data } = await api.get(`/tags/autocomplete?q=${encodeURIComponent(val)}&limit=6`);
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    doSearch(name, tab);
  };

  const hasResults = tab === 'projects' ? projects.length > 0 : tab === 'users' ? users.length > 0 : tags.length > 0;

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 32 }}>Поиск</h1>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={16} color="var(--text-3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <Input value={query} onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); doSearch(query); } }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Проекты, авторы, теги..." style={{ paddingLeft: 44 }} />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', marginTop: 4, zIndex: 10, overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => selectSuggestion(s.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', fontSize: 14, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Tag size={14} style={{ opacity: 0.4 }} />
                    <span>{s.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>{s.useCount} проект{s.useCount % 10 === 1 && s.useCount !== 11 ? '' : s.useCount % 10 >= 2 && s.useCount % 10 <= 4 && (s.useCount < 10 || s.useCount > 20) ? 'а' : 'ов'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="primary" onClick={() => doSearch(query)}>Найти</Button>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} style={{ marginBottom: 32 }}>
          <TabsList style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            {[['projects', 'Проекты', Briefcase], ['users', 'Авторы', Users], ['tags', 'Теги', Tag]].map(([val, lbl, Icon]) => (
              <TabsTrigger key={val} value={val} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', border: 'none', background: 'none', color: tab === val ? 'var(--accent)' : 'var(--text-3)', borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontWeight: 500, fontSize: 14, transition: 'all 0.2s' }}>
                <Icon size={15} /> {lbl}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!q && popularTags.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} /> Популярные теги
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {popularTags.map(t => (
                <button key={t.id} onClick={() => selectSuggestion(t.name)}
                  style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>Загрузка...</div>
        ) : !hasResults && q ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Ничего не найдено</h3>
            <p className="empty-state-text">Попробуйте другие ключевые слова.</p>
          </div>
        ) : !hasResults && !q ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Начните поиск</h3>
            <p className="empty-state-text">Введите запрос для поиска проектов, авторов и тегов.</p>
          </div>
        ) : tab === 'projects' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{p.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.author?.displayName}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {p.likeCount || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {p.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : tab === 'users' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {users.map(u => (
              <Link key={u.id} to={`/profile/${u.username}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', textAlign: 'center', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.displayName}&background=6c5ce7&color=fff`} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{u.displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>@{u.username}</div>
                {u.headline && <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{u.headline}</div>}
                {(u.openToWork || u.openToHire) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.openToWork && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,200,83,0.15)', color: '#00c853' }}>Open to Work</span>}
                    {u.openToHire && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(108,92,231,0.15)', color: '#6c5ce7' }}>Hiring</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {tags.map(t => (
              <button key={t.id} onClick={() => selectSuggestion(t.name)}
                style={{ padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>#{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.useCount} проект{t.useCount % 10 === 1 && t.useCount !== 11 ? '' : t.useCount % 10 >= 2 && t.useCount % 10 <= 4 && (t.useCount < 10 || t.useCount > 20) ? 'а' : 'ов'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
