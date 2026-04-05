import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const cardStyle = {
    maxWidth: 440,
    margin: '0 auto',
    padding: 48,
    background: 'rgba(18, 18, 24, 0.9)',
    backdropFilter: 'blur(40px) saturate(1.6)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-xl)',
    textAlign: 'center',
  };

  return (
    <div style={{ paddingTop: 180, minHeight: '100vh', position: 'relative', zIndex: 1, padding: '180px 24px 100px' }}>
      <div style={cardStyle}>
        {status === 'loading' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>Подтверждение email...</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Пожалуйста, подождите</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>Email подтверждён</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Ваш email успешно подтверждён.</p>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>Ошибка подтверждения</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Ссылка недействительна или истекла.</p>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </>
        )}
      </div>
    </div>
  );
}
