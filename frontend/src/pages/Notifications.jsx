import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Heart, MessageCircle, UserPlus, Trophy, Bell } from 'lucide-react';

const ICONS = { LIKE: Heart, COMMENT: MessageCircle, FOLLOW: UserPlus, CHALLENGE_WINNER: Trophy, SYSTEM: Bell };
const LABELS = { LIKE: 'понравился ваш проект', COMMENT: 'прокомментировал ваш проект', FOLLOW: 'подписался на вас', CHALLENGE_WINNER: 'вы победили в челлендже!', SYSTEM: 'системное уведомление' };

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => { setNotifs(data.notifications); setUnread(data.unreadCount); }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read', {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Уведомления {unread > 0 && <span style={{ fontSize: 18, color: 'var(--accent)' }}>({unread})</span>}</h1>
          {unread > 0 && <button className="rdx-btn rdx-btn-ghost" onClick={markAllRead}>Прочитать все</button>}
        </div>
        {notifs.length === 0 ? (
          <div className="empty-state"><Bell size={64} color="var(--text-3)" style={{ opacity: 0.2, margin: '0 auto 24px' }} /><h3 className="empty-state-title">Нет уведомлений</h3><p className="empty-state-text">Когда кто-то взаимодействует с вашими проектами, уведомления появятся здесь.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {notifs.map(n => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <div key={n.id} style={{
                  display: 'flex', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius-sm)',
                  background: n.read ? 'transparent' : 'rgba(79,209,255,0.03)',
                  border: `1px solid ${n.read ? 'transparent' : 'rgba(79,209,255,0.08)'}`, transition: 'all 0.3s',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                    <Icon size={16} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}><strong>{n.actor?.displayName}</strong> <span style={{ color: 'var(--text-2)' }}>{LABELS[n.type]}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
