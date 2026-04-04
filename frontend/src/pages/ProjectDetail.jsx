import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Heart, Eye, MessageCircle, Share2, Bookmark, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/projects/${id}`)
      .then(({ data }) => {
        setProject(data.project);
        setSimilar(data.similar || []);
        setLiked(data.project.isLiked);
        setLikeCount(data.project.likeCount);
        setFollowing(data.project.isFollowing);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));

    api.get(`/comments/projects/${id}/comments`)
      .then(({ data }) => setComments(data.comments))
      .catch(() => {});
  }, [id]);

  const toggleLike = async () => {
    if (!user) return showToast('Войдите, чтобы ставить лайки', 'error');
    try {
      if (liked) {
        await api.delete(`/projects/${id}/like`);
        setLiked(false);
        setLikeCount(c => c - 1);
      } else {
        await api.post(`/projects/${id}/like`);
        setLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch {}
  };

  const toggleFollow = async () => {
    if (!user || !project) return;
    try {
      if (following) {
        await api.delete(`/users/${project.author.id}/follow`);
        setFollowing(false);
      } else {
        await api.post(`/users/${project.author.id}/follow`);
        setFollowing(true);
        showToast('Вы подписались!', 'success');
      }
    } catch {}
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      const { data } = await api.post(`/comments/projects/${id}/comments`, { content: commentText });
      setComments(prev => [data.comment, ...prev]);
      setCommentText('');
      showToast('Комментарий добавлен', 'success');
    } catch {
      showToast('Ошибка отправки', 'error');
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка...</div>;
  if (!project) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center' }}><h2>Проект не найден</h2></div>;

  return (
    <Tooltip.Provider>
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Back */}
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)', marginBottom: 32, transition: 'color 0.3s' }}>
          <ArrowLeft size={14} /> Назад к проектам
        </Link>

        {/* Cover */}
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 40, background: 'var(--card)' }}>
          <img src={project.cover} alt={project.title} style={{ width: '100%', maxHeight: 560, objectFit: 'cover' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em', marginBottom: 16 }}>
              {project.title}
            </h1>
            <Link to={`/profile/${project.author.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {project.author.avatar && <img src={project.author.avatar} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--glass-border)' }} alt="" />}
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{project.author.displayName || project.author.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{project.author.username}</div>
              </div>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button onClick={toggleLike} className="btn-icon" style={{ background: liked ? 'var(--accent-dim)' : undefined, borderColor: liked ? 'var(--accent)' : undefined }}>
                  <Heart size={16} fill={liked ? 'var(--accent)' : 'none'} color={liked ? 'var(--accent)' : 'var(--text-2)'} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={6}>{likeCount} likes</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="btn-icon"><Bookmark size={16} color="var(--text-2)" /></button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={6}>Сохранить в коллекцию</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="btn-icon"><Share2 size={16} color="var(--text-2)" /></button>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={6}>Поделиться</Tooltip.Content>
            </Tooltip.Root>

            {user && project.author.id !== user.id && (
              <button className={`btn ${following ? 'btn-secondary' : 'btn-primary'} btn-sm`} onClick={toggleFollow}>
                {following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 40, fontSize: 13, color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Heart size={14} /> {likeCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={14} /> {project.viewCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageCircle size={14} /> {comments.length}</span>
        </div>

        {/* Description */}
        {project.description && (
          <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 40, maxWidth: 700 }}>
            {project.description}
          </div>
        )}

        {/* Media gallery */}
        {project.media?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
            {project.media.map(m => (
              <div key={m.id} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {m.type === 'VIDEO' ? (
                  <video src={m.url} controls style={{ width: '100%' }} />
                ) : (
                  <img src={m.url} alt="" style={{ width: '100%' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 48 }}>
            {project.tags.map(t => (
              <Link key={t} to={`/search?q=${t}`} style={{
                padding: '6px 16px', borderRadius: 100, background: 'var(--glass)',
                border: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-2)',
              }}>{t}</Link>
            ))}
          </div>
        )}

        {/* Tools */}
        {project.tools?.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Инструменты</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {project.tools.map(t => (
                <span key={t} style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', fontSize: 13 }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 48 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 32 }}>Комментарии ({comments.length})</h3>

          {user && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
              <input className="input" placeholder="Написать комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment()} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={submitComment}>Отправить</button>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 14 }}>
              Пока нет комментариев. Будьте первым!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                  <img src={c.user.avatar} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--glass-border)' }} alt="" />
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Link to={`/profile/${c.user.username}`} style={{ fontWeight: 500, fontSize: 14 }}>{c.user.displayName}</Link>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(c.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similar projects */}
        {similar.length > 0 && (
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 48, marginTop: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 32 }}>Похожие проекты</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {similar.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)' }}>
                  <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{p.author?.displayName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </Tooltip.Provider>
  );
}
