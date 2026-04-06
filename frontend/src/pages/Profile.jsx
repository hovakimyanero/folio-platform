import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import * as Avatar from '@radix-ui/react-avatar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Globe, UserPlus, UserCheck, Calendar, Heart, Eye, Award, Briefcase, GraduationCap, Star, Shield } from 'lucide-react';

const LEVEL_LABELS = {
  NEWCOMER: { label: 'Новичок', color: '#94a3b8' },
  RISING: { label: 'Растущий', color: '#6366f1' },
  ESTABLISHED: { label: 'Признанный', color: '#10b981' },
  TOP: { label: 'Топ', color: '#f59e0b' },
  LEGEND: { label: 'Легенда', color: '#ef4444' },
};

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('projects');
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    api.get(`/users/${username}`).then(({ data }) => {
      setProfile(data.user);
      setFollowing(data.user.isFollowing);
    }).catch(() => setProfile(null));

    api.get(`/users/${username}/projects`).then(({ data }) => setProjects(data.projects)).catch(() => {});
  }, [username]);

  const toggleFollow = async () => {
    if (!me || !profile) return;
    try {
      if (following) {
        await api.delete(`/users/${profile.id}/follow`);
        setFollowing(false);
        setProfile(p => ({ ...p, _count: { ...p._count, followers: p._count.followers - 1 } }));
      } else {
        await api.post(`/users/${profile.id}/follow`);
        setFollowing(true);
        setProfile(p => ({ ...p, _count: { ...p._count, followers: p._count.followers + 1 } }));
        showToast('Подписка оформлена', 'success');
      }
    } catch {}
  };

  if (!profile) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка профиля...</div>;

  const isOwn = me?.id === profile.id;

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Cover */}
      <div className="profile-cover" style={{ height: 280, background: profile.cover ? `url(${profile.cover}) center/cover` : 'linear-gradient(135deg, var(--card), var(--surface))', borderRadius: 0 }} />

      <div style={{ maxWidth: 1000, margin: '-60px auto 0', padding: '0 24px 80px' }}>
        <div className="profile-header" style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 40 }}>
          <Avatar.Root className="profile-avatar" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--bg)', flexShrink: 0 }}>
            <Avatar.Image src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Avatar.Fallback style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', fontSize: 36, fontFamily: 'var(--font-display)' }}>
              {(profile.displayName || profile.username)[0]}
            </Avatar.Fallback>
          </Avatar.Root>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-name-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '-0.02em' }}>{profile.displayName || profile.username}</h1>
                  {profile.isVerified && <Shield size={16} color="var(--accent)" />}
                  {profile.isPro && (
                    <span style={{ padding: '2px 8px', borderRadius: 100, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>PRO</span>
                  )}
                  {profile.level && LEVEL_LABELS[profile.level] && (
                    <span style={{ padding: '2px 10px', borderRadius: 100, background: `${LEVEL_LABELS[profile.level].color}20`, color: LEVEL_LABELS[profile.level].color, fontSize: 11, fontWeight: 600 }}>
                      {LEVEL_LABELS[profile.level].label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-3)' }}>@{profile.username}</div>
                {profile.headline && <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>{profile.headline}</div>}
                {(profile.openToWork || profile.openToHire) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {profile.openToWork && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11, color: '#10b981', fontWeight: 500 }}>
                        <Briefcase size={11} /> Ищу работу
                      </span>
                    )}
                    {profile.openToHire && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, color: '#6366f1', fontWeight: 500 }}>
                        <Briefcase size={11} /> Нанимаю
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!isOwn && me && (
                <button className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`} onClick={toggleFollow} style={{ flexShrink: 0 }}>
                  {following ? <><UserCheck size={14} /> Подписка</> : <><UserPlus size={14} /> Подписаться</>}
                </button>
              )}
              {isOwn && <Link to="/settings" className="btn btn-secondary" style={{ flexShrink: 0 }}>Редактировать</Link>}
            </div>
          </div>
        </div>

        {/* Bio & meta */}
        {profile.bio && <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24, maxWidth: 600 }}>{profile.bio}</p>}
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-3)', marginBottom: 16, flexWrap: 'wrap' }}>
          {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> {profile.location}</span>}
          {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}><Globe size={13} /> {profile.website.replace(/https?:\/\//, '')}</a>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {new Date(profile.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 48, fontSize: 14 }}>
          <span><strong>{profile._count.projects}</strong> <span style={{ color: 'var(--text-3)' }}>проектов</span></span>
          <span><strong>{profile._count.followers}</strong> <span style={{ color: 'var(--text-3)' }}>подписчиков</span></span>
          <span><strong>{profile._count.following}</strong> <span style={{ color: 'var(--text-3)' }}>подписок</span></span>
        </div>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {profile.badges.map(ub => (
              <div key={ub.id} title={ub.badge.description} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 100, background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.1), rgba(var(--accent-rgb), 0.05))',
                border: '1px solid rgba(var(--accent-rgb), 0.2)', fontSize: 12, color: 'var(--accent)',
              }}>
                <Award size={12} /> {ub.badge.name}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {profile.skills.map(s => (
              <span key={s} style={{ padding: '6px 16px', borderRadius: 100, background: 'var(--glass)', border: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-2)' }}>{s}</span>
            ))}
          </div>
        )}

        {/* Specialization */}
        {profile.specialization?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {profile.specialization.map(s => (
              <span key={s} style={{ padding: '6px 16px', borderRadius: 100, background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.2)', fontSize: 12, color: 'var(--accent)' }}>{s}</span>
            ))}
          </div>
        )}

        {/* Languages */}
        {profile.languages?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {profile.languages.map(l => (
              <span key={l} style={{ padding: '6px 16px', borderRadius: 100, background: 'var(--surface)', fontSize: 12, color: 'var(--text-3)' }}>{l}</span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 40, width: 'fit-content' }}>
            <Tabs.Trigger value="projects" style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === 'projects' ? 'var(--text)' : 'var(--text-3)', background: tab === 'projects' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>Проекты</Tabs.Trigger>
            <Tabs.Trigger value="liked" style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === 'liked' ? 'var(--text)' : 'var(--text-3)', background: tab === 'liked' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>Понравившиеся</Tabs.Trigger>
            <Tabs.Trigger value="about" style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, color: tab === 'about' ? 'var(--text)' : 'var(--text-3)', background: tab === 'about' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>О себе</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="projects">
            {projects.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">Нет проектов</h3>
                <p className="empty-state-text">{isOwn ? 'Загрузите свой первый проект!' : 'Этот автор ещё не опубликовал проекты.'}</p>
                {isOwn && <Link to="/upload" className="btn btn-primary">Загрузить проект</Link>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {projects.map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                    <img src={p.cover} alt={p.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                    <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</span>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {p.likeCount || p._count?.likes || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {p.viewCount || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Tabs.Content>
          <Tabs.Content value="liked"><div className="empty-state"><p className="empty-state-text">Понравившиеся проекты появятся здесь.</p></div></Tabs.Content>
          <Tabs.Content value="about">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {profile.bio && <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8 }}>{profile.bio}</div>}

              {/* Experience */}
              {profile.experience?.length > 0 && (
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    <Briefcase size={16} color="var(--text-3)" /> Опыт
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {profile.experience.map((exp, i) => (
                      <div key={i} style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{exp.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>{exp.company}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{exp.period}</div>
                        {exp.description && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.6 }}>{exp.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education?.length > 0 && (
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    <GraduationCap size={16} color="var(--text-3)" /> Образование
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {profile.education.map((edu, i) => (
                      <div key={i} style={{ padding: '16px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{edu.institution}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>{edu.degree}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{edu.period}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom CTA */}
              {profile.customCTA?.label && profile.customCTA?.url && (
                <a href={profile.customCTA.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {profile.customCTA.label}
                </a>
              )}

              {!profile.bio && !profile.experience?.length && !profile.education?.length && (
                <div style={{ fontSize: 15, color: 'var(--text-3)' }}>Информация не указана.</div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
