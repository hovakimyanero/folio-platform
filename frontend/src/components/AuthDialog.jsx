import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, Input, Label, Button, IconButton, Checkbox, Separator } from './ui';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function AuthDialog({ open, onOpenChange, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError('');
      setRegistered(false);
      setNeedsVerification(false);
    }
  }, [open, initialMode]);

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
        if (!agreeTerms) {
          setError('Необходимо принять условия использования');
          setLoading(false);
          return;
        }
        await register(email, username, password);
        setRegistered(true);
        return;
      }
      onOpenChange(false);
      setEmail(''); setUsername(''); setPassword('');
    } catch (err) {
      const errData = err.response?.data?.error;
      setError(errData?.message || 'Произошла ошибка');
      if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="rdx-dialog-overlay" />
        <DialogPrimitive.Content className="rdx-dialog-content" style={{ width: 'min(440px, 90vw)', padding: 48 }}>
          <DialogPrimitive.Close asChild>
            <IconButton style={{ position: 'absolute', top: 16, right: 16 }}>
              <X size={14} />
            </IconButton>
          </DialogPrimitive.Close>

          {registered ? (
            <>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: 20 }} />
                <DialogPrimitive.Title style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>
                  Проверьте почту
                </DialogPrimitive.Title>
                <DialogPrimitive.Description style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32 }}>
                  Мы отправили письмо на <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />
                  Перейдите по ссылке в письме, чтобы подтвердить аккаунт.
                </DialogPrimitive.Description>
                <Button variant="primary"
                  onClick={() => { setMode('login'); setRegistered(false); setEmail(''); setUsername(''); setPassword(''); }}
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}
                >
                  Перейти к входу
                </Button>
                <button
                  type="button"
                  onClick={async () => {
                    setResending(true);
                    try {
                      await api.post('/auth/resend-verification', { email });
                      showToast('Письмо отправлено повторно', 'success');
                    } catch {} finally { setResending(false); }
                  }}
                  disabled={resending}
                  style={{ fontSize: 13, color: 'var(--text-3)' }}
                >
                  {resending ? 'Отправка...' : 'Не пришло? Отправить ещё раз'}
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogPrimitive.Title style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>
                {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
                {mode === 'login' ? 'Войдите, чтобы публиковать и вдохновлять' : 'Присоединяйтесь к сообществу дизайнеров'}
              </DialogPrimitive.Description>

              {/* OAuth */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <Button variant="secondary" style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </Button>
                <Button variant="secondary" style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Apple
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, fontSize: 12, color: 'var(--text-3)' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                или
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'register' && (
                  <div>
                    <Label>Имя пользователя</Label>
                    <Input type="text" placeholder="ваш_логин" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>{mode === 'login' ? 'Email или username' : 'Email'}</Label>
                  <Input type={mode === 'register' ? 'email' : 'text'} placeholder={mode === 'login' ? 'you@example.com или username' : 'you@example.com'} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Пароль</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  {mode === 'login' && (
                    <Link to="/reset-password" onClick={() => onOpenChange(false)} style={{ display: 'block', textAlign: 'right', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                      Забыли пароль?
                    </Link>
                  )}
                </div>

                {mode === 'register' && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-3)', cursor: 'pointer' }}>
                    <Checkbox checked={agreeTerms} onCheckedChange={setAgreeTerms} style={{ marginTop: 2 }} />
                    <span>Я принимаю <Link to="/terms" onClick={() => onOpenChange(false)} style={{ color: 'var(--accent)' }}>условия использования</Link> и <Link to="/privacy" onClick={() => onOpenChange(false)} style={{ color: 'var(--accent)' }}>политику конфиденциальности</Link></span>
                  </label>
                )}

                {error && (
                  <div style={{ fontSize: 13, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-xs)' }}>
                    {error}
                    {needsVerification && (
                      <button
                        type="button"
                        onClick={async () => {
                          setResending(true);
                          try {
                            await api.post('/auth/resend-verification', { email });
                            showToast('Письмо отправлено повторно', 'success');
                          } catch {} finally { setResending(false); }
                        }}
                        disabled={resending}
                        style={{ display: 'block', marginTop: 8, color: 'var(--accent)', fontWeight: 500, fontSize: 12 }}
                      >
                        {resending ? 'Отправка...' : 'Отправить письмо повторно'}
                      </button>
                    )}
                  </div>
                )}

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 4, borderRadius: 'var(--radius-sm)' }}
                >
                  {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>
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
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
