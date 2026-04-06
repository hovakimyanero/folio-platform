import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthDialog } from '../context/AuthDialogContext';
import api from '../utils/api';

export default function Home() {
  const { user } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const [stats, setStats] = useState({ users: 0, projects: 0, views: 0 });

  useEffect(() => {
    api.get('/projects/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const formatNum = (n) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
  };

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
            <button className="btn btn-primary btn-lg" onClick={() => openAuthDialog('register')}>
              Начать бесплатно
            </button>
          )}
          <Link to="/projects" className="btn btn-secondary btn-lg">Смотреть работы</Link>
        </div>

        <div className="hero-stats" style={{ display: 'flex', gap: 72, marginTop: 100 }}>
          {[{ num: formatNum(stats.users), label: 'Авторов' }, { num: formatNum(stats.projects), label: 'Проектов' }, { num: formatNum(stats.views), label: 'Просмотров' }].map(s => (
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

      {/* CTA — only for guests */}
      {!user && (
        <section className="cta-section" style={{ padding: '200px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 20, opacity: 0.8 }}>
            Готовы начать?
          </div>
          <h2 className="cta-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.045em' }}>
            Покажите миру<br />свой <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>талант</em>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 440, margin: '28px auto 52px', lineHeight: 1.8, fontWeight: 300 }}>
            Присоединяйтесь к {formatNum(stats.users)}+ креативных профессионалов.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => openAuthDialog('register')}>Создать портфолио</button>
        </section>
      )}
    </div>
  );
}
