import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookies_accepted', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 6000,
      background: 'rgba(18, 18, 24, 0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--glass-border)', padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 600, margin: 0 }}>
        Мы используем cookies для обеспечения работы сайта.{' '}
        <Link to="/cookies" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Подробнее</Link>
      </p>
      <button className="rdx-btn rdx-btn-primary rdx-btn-sm" onClick={accept}>Принять</button>
    </div>
  );
}
