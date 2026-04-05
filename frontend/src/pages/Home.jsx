import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowRight, Sparkles, TrendingUp, Clock, LayoutGrid, Users, Trophy } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects?sort=featured&limit=5').catch(() => ({ data: { projects: [] } })),
      api.get('/projects?sort=trending&limit=4').catch(() => ({ data: { projects: [] } })),
      api.get('/projects?sort=recent&limit=4').catch(() => ({ data: { projects: [] } })),
    ]).then(([f, t, r]) => {
      setFeatured(f.data.projects);
      setTrending(t.data.projects);
      setRecent(r.data.projects);
      setLoading(false);
    });
  }, []);

  const categories = ['UI/UX Design', 'Branding', '3D & Motion', 'Illustration', 'Web Design', 'Mobile Apps', 'Typography', 'Photography', 'Product Design', 'Game Design'];

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO */}
      <section className="hero-section" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: '180px 48px 140px', position: 'relative',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '8px 24px', borderRadius: 100,
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)', fontSize: 12, color: 'var(--text-2)',
          letterSpacing: '0.04em', marginBottom: 48,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
          Платформа для креативных профессионалов
        </div>

        <h1 className="hero-title" style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8.5vw, 120px)',
          lineHeight: 0.9, letterSpacing: '-0.045em', marginBottom: 36,
        }}>
          Where <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>creativity</em><br />finds its stage
        </h1>

        <p style={{ fontSize: 'clamp(16px, 1.3vw, 20px)', color: 'var(--text-2)', maxWidth: 520, lineHeight: 1.8, fontWeight: 300, marginBottom: 56 }}>
          Публикуйте работы, находите вдохновение и общайтесь с лучшими дизайнерами мира.
        </p>

        <div className="cta-buttons" style={{ display: 'flex', gap: 16 }}>
          {user ? (
            <Link to="/upload" className="btn btn-primary btn-lg">Загрузить проект</Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => document.querySelector('[data-auth-trigger]')?.click()}>
              Начать бесплатно
            </button>
          )}
          <Link to="/projects" className="btn btn-secondary btn-lg">Смотреть работы</Link>
        </div>

        <div className="hero-stats" style={{ display: 'flex', gap: 72, marginTop: 100 }}>
          {[{ num: '280K+', label: 'Авторов' }, { num: '1.2M', label: 'Проектов' }, { num: '4.8B', label: 'Просмотров' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="hero-stat-number" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES MARQUEE */}
      <div style={{ padding: '50px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 12, width: 'max-content', animation: 'drift 50s linear infinite' }}>
          {[...categories, ...categories].map((c, i) => (
            <Link
              key={i}
              to={`/categories/${c.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              style={{
                padding: '14px 34px', borderRadius: 100, background: 'var(--glass)',
                border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)',
                fontSize: 14, color: 'var(--text-2)', whiteSpace: 'nowrap',
                transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)', flexShrink: 0,
              }}
            >
              {c}
            </Link>
          ))}
        </div>
        <style>{`@keyframes drift { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
      </div>

      {/* FEATURED PROJECTS */}
      <Section label="Featured" title="Избранные проекты" icon={<Sparkles size={14} />} link="/projects?sort=featured">
        {featured.length === 0 && !loading ? (
          <EmptyState title="Пока нет избранных" text="Здесь появятся лучшие проекты, отобранные командой Folio. Ты можешь стать первым!" />
        ) : (
          <div className="featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {featured.map((p, i) => (
              <ProjectCard key={p.id} project={p} large={i === 0} />
            ))}
          </div>
        )}
      </Section>

      {/* TRENDING */}
      <Section label="Trending" title="В тренде сейчас" icon={<TrendingUp size={14} />} link="/projects?sort=trending" bg>
        {trending.length === 0 && !loading ? (
          <EmptyState title="Тренды формируются" text="Загрузите первый проект, чтобы запустить алгоритм трендов." />
        ) : (
          <div className="project-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {trending.map(p => <SmallCard key={p.id} project={p} />)}
          </div>
        )}
      </Section>

      {/* RECENT */}
      <Section label="Recent" title="Новые работы" icon={<Clock size={14} />} link="/projects">
        {recent.length === 0 && !loading ? (
          <EmptyState title="Здесь пока пусто" text="Будьте первым, кто опубликует проект на платформе." />
        ) : (
          <div className="project-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {recent.map(p => <SmallCard key={p.id} project={p} />)}
          </div>
        )}
      </Section>

      {/* CTA */}
      <section className="cta-section" style={{ padding: '200px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 20, opacity: 0.8 }}>
          Готовы начать?
        </div>
        <h2 className="cta-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.045em' }}>
          Покажите миру<br />свой <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>талант</em>
        </h2>
        <p style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 440, margin: '28px auto 52px', lineHeight: 1.8, fontWeight: 300 }}>
          Присоединяйтесь к 280 000+ креативных профессионалов.
        </p>
        {!user && (
          <button className="btn btn-primary btn-lg">Создать портфолио</button>
        )}
      </section>
    </div>
  );
}

// ── Section wrapper ──
function Section({ label, title, icon, link, bg, children }) {
  return (
    <section className="section-padded" style={{ padding: '140px 48px', position: 'relative', zIndex: 1, background: bg ? 'var(--surface)' : 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 16, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon} {label}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>{title}</h2>
        </div>
        {link && (
          <Link to={link} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)', transition: 'color 0.4s' }}>
            Смотреть все <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Project Card (large) ──
function ProjectCard({ project, large }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="pcard"
      style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'var(--card)', gridColumn: large ? 'span 2' : undefined,
        gridRow: large ? 'span 2' : undefined,
        transition: 'box-shadow 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <img
        src={project.cover}
        alt={project.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: large ? undefined : '4/3', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(11,11,13,0.95) 0%, rgba(11,11,13,0.3) 40%, transparent 70%)',
        opacity: 0, transition: 'opacity 0.5s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 36,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: large ? 28 : 20, marginBottom: 8 }}>{project.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {project.author?.avatar && <img src={project.author.avatar} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />}
          {project.author?.displayName || project.author?.username}
        </div>
      </div>
    </Link>
  );
}

// ── Small Card ──
function SmallCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="scard"
      style={{
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        background: 'var(--card)', border: '1px solid var(--glass-border)',
        transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={project.cover} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
      <div style={{ padding: '16px 16px 4px' }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {project.author?.displayName || project.author?.username}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px 14px', fontSize: 11, color: 'var(--text-3)' }}>
        <span>{project.likeCount || 0} likes</span>
        <span>{project.viewCount || 0} views</span>
      </div>
    </Link>
  );
}

// ── Empty State ──
function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <LayoutGrid size={64} color="var(--text-3)" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{text}</p>
      <Link to="/upload" className="btn btn-primary">Загрузить проект</Link>
    </div>
  );
}
