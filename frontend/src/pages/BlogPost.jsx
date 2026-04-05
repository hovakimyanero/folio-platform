import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react';

export default function BlogPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blog/${id}`).then(({ data }) => setPost(data.post)).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Удалить статью?')) return;
    try {
      await api.delete(`/blog/${id}`);
      showToast('Статья удалена', 'success');
      navigate('/blog');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка...</div>;
  if (!post) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center' }}><h2>Статья не найдена</h2></div>;

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
          <ArrowLeft size={14} /> Назад к блогу
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em', marginBottom: 16 }}>{post.title}</h1>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 40, fontSize: 13, color: 'var(--text-3)' }}>
          <Link to={`/profile/${post.author.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {post.author.avatar && <img src={post.author.avatar} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />}
            <span>{post.author.displayName || post.author.username}</span>
          </Link>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {user?.id === post.authorId && (
            <button onClick={handleDelete} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <Trash2 size={14} /> Удалить
            </button>
          )}
        </div>

        <div style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>
      </div>
    </div>
  );
}
