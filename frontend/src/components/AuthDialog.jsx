import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        showToast('Добро пожаловать!', 'success');
      } else {
        if (!username || username.length < 3) {
          setError('Username должен быть минимум 3 символа');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Пароль должен быть минимум 8 символов');
          setLoading(false);
          return;
        }
        await register(email, username, password);
        showToast('Аккаунт создан! Проверьте email для подтверждения.', 'success');
      }
      onOpenChange(false);
      setEmail(''); setUsername(''); setPassword('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content style={{ width: 'min(440px, 90vw)', padding: 48 }}>
          <Dialog.Close asChild>
            <button className="btn-icon" style={{ position: 'absolute', top: 16, right: 16 }}>
              <X size={14} />
            </button>
          </Dialog.Close>

          <Dialog.Title style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>
            {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
          </Dialog.Title>
          <Dialog.Description style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
            {mode === 'login' ? 'Войдите, чтобы публиковать и вдохновлять' : 'Присоединяйтесь к сообществу дизайнеров'}
          </Dialog.Description>

          {/* OAuth */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button className="btn-secondary" style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-sm)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="btn-secondary" style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-sm)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            или
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label className="input-label">Username</label>
                <input className="input" type="text" placeholder="your_username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Пароль</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-xs)' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: 4, opacity: loading ? 0.6 : 1, borderRadius: 'var(--radius-sm)' }}
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' }}>
            {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ color: 'var(--accent)', fontWeight: 500 }}
            >
              {mode === 'login' ? 'Регистрация' : 'Войти'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
