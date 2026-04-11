import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, Download, Star, Filter, Search, Plus, Package } from 'lucide-react';

const TYPES = [
  { value: '', label: 'Все' },
  { value: 'UI_KIT', label: 'UI Kit' },
  { value: 'TEMPLATE', label: 'Шаблоны' },
  { value: 'ICON_PACK', label: 'Иконки' },
  { value: 'FONT', label: 'Шрифты' },
  { value: 'MOCKUP', label: 'Мокапы' },
  { value: 'ILLUSTRATION', label: 'Иллюстрации' },
  { value: 'TEXTURE', label: 'Текстуры' },
  { value: 'OTHER', label: 'Другое' },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState(params.get('type') || '');
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const [search, setSearch] = useState(params.get('q') || '');

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (sort) q.set('sort', sort);
    if (search) q.set('search', search);
    q.set('limit', '24');

    api.get(`/marketplace?${q.toString()}`)
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [type, sort, search]);

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 8 }}>
              Маркетплейс
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: 15 }}>
              Дизайн-ресурсы от лучших авторов — {total} товаров
            </p>
          </div>
          {user && (
            <Link to="/marketplace/create" className="rdx-btn rdx-btn-primary">
              <Plus size={14} /> Добавить товар
            </Link>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <Search size={16} color="var(--text-3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="rdx-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск ресурсов..."
              style={{ paddingLeft: 40 }}
            />
          </div>
          <select className="rdx-input" value={type} onChange={e => setType(e.target.value)} style={{ appearance: 'none', width: 'auto', minWidth: 140 }}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="rdx-input" value={sort} onChange={e => setSort(e.target.value)} style={{ appearance: 'none', width: 'auto', minWidth: 140 }}>
            <option value="newest">Новые</option>
            <option value="popular">Популярные</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </div>

        {/* Type pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              style={{
                padding: '8px 18px', borderRadius: 100, fontSize: 13,
                background: type === t.value ? 'var(--accent)' : 'var(--glass)',
                color: type === t.value ? '#000' : 'var(--text-2)',
                border: `1px solid ${type === t.value ? 'var(--accent)' : 'var(--glass-border)'}`,
                cursor: 'pointer', transition: 'all 0.2s', fontWeight: type === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Package size={48} color="var(--text-3)" style={{ marginBottom: 16 }} />
            <h3 className="empty-state-title">Ничего не найдено</h3>
            <p className="empty-state-text">Попробуйте изменить фильтры.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  transition: 'transform 0.3s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ position: 'relative' }}>
                  {item.previewImages?.[0] && (
                    <img src={item.previewImages[0]} alt={item.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />
                  )}
                  <div style={{
                    position: 'absolute', top: 10, right: 10, padding: '4px 10px',
                    borderRadius: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    fontSize: 11, color: 'var(--text-2)',
                  }}>
                    {TYPES.find(t => t.value === item.type)?.label || item.type}
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.author?.avatar && <img src={item.author.avatar} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />}
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.author?.displayName}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: item.price === 0 ? 'var(--accent)' : 'var(--text)' }}>
                      {item.price === 0 ? 'Бесплатно' : `$${item.price}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
