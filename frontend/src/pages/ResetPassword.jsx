import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(token ? 'form' : 'request'); // request | form | success | error
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch {
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Минимум 8 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Ссылка недействительна или истекла');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    maxWidth: 440,
    margin: '0 auto',
    padding: 48,
    background: 'rgba(18, 18, 24, 0.9)',
    backdropFilter: 'blur(40px) saturate(1.6)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-xl)',
  };

  return (
    <div style={{ paddingTop: 180, minHeight: '100vh', position: 'relative', zIndex: 1, padding: '180px 24px 100px' }}>
      <div style={cardStyle}>
        {status === 'request' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Сброс пароля</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>Введите email, и мы отправим ссылку для сброса</p>
            <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <div style={{ fontSize: 13, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-xs)' }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Отправка...' : 'Отправить ссылку'}
              </button>
            </form>
          </>
        )}

        {status === 'form' && (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Новый пароль</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>Введите новый пароль (минимум 8 символов)</p>
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Новый пароль</label>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Подтвердите пароль</label>
                <input className="input" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              {error && <div style={{ fontSize: 13, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-xs)' }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </form>
          </>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>
              {token ? 'Пароль обновлён' : 'Письмо отправлено'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
              {token ? 'Теперь вы можете войти с новым паролем.' : 'Проверьте почту для инструкций по сбросу пароля.'}
            </p>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </div>
        )}
      </div>
    </div>
  );
}
