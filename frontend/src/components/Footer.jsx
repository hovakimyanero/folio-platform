import { Link } from 'react-router-dom';

const columns = [
  { title: 'Платформа', links: [{ label: 'Обзор', to: '/projects' }, { label: 'Тренды', to: '/projects?sort=trending' }, { label: 'Коллекции', to: '/collections' }, { label: 'Челленджи', to: '/challenges' }] },
  { title: 'Сообщество', links: [{ label: 'Блог', to: '/blog' }, { label: 'События', to: '/events' }, { label: 'Вакансии', to: '/jobs' }] },
  { title: 'Поддержка', links: [{ label: 'FAQ', to: '/faq' }] },
  { title: 'Правовое', links: [{ label: 'Условия', to: '/terms' }, { label: 'Конфиденциальность', to: '/privacy' }, { label: 'Cookies', to: '/cookies' }] },
];

export default function Footer() {
  return (
    <footer className="footer-inner" style={{ borderTop: '1px solid var(--glass-border)', padding: '80px 48px 40px', position: 'relative', zIndex: 1 }}>
      <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48, marginBottom: 64 }}>
        <div className="footer-brand" style={{ maxWidth: 260 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 16 }}>
            Folio<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.8 }}>
            Платформа для дизайнеров, иллюстраторов и креативных студий. Создавайте, делитесь и находите вдохновение.
          </p>
        </div>
        {columns.map(col => (
          <div key={col.title}>
            <h4 style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 20 }}>
              {col.title}
            </h4>
            {col.links.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 12, transition: 'color 0.3s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--text)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
                >
                  {link.label}
                </Link>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 32, borderTop: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-3)',
      }}>
        <span>&copy; 2026 Folio. Все права защищены.</span>
      </div>
    </footer>
  );
}
