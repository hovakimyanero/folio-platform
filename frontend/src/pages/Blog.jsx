import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Calendar, User } from 'lucide-react';

export default function Blog() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get('/blog').then(({ data }) => setPosts(data.posts)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return showToast('Заполните заголовок и содержание', 'error');
    setPublishing(true);
    try {
      const { data } = await api.post('/blog', { title, content });
      setPosts(prev => [data.post, ...prev]);
      setTitle('');
      setContent('');
      setShowForm(false);
      showToast('Статья опубликована!', 'success');
    } catch { showToast('Ошибка публикации', 'error'); }
    finally { setPublishing(false); }
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', margin: 0 }}>Блог</h1>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <Plus size={14} /> Написать статью
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 40 }}>
            <input className="input" placeholder="Заголовок статьи" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }} />
            <textarea className="input" placeholder="Содержание статьи..." value={content} onChange={e => setContent(e.target.value)} rows={10} style={{ resize: 'vertical', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>{publishing ? 'Публикация...' : 'Опубликовать'}</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 80 }}>Загрузка...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Пока нет статей</h3>
            <p className="empty-state-text">Станьте первым автором блога!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.id}`} style={{ background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 32, transition: 'border-color 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '-0.02em', marginBottom: 12 }}>{post.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt || post.content.substring(0, 200)}...</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {post.author.displayName || post.author.username}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString('ru')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
