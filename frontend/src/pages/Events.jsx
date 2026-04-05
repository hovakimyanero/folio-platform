import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Trophy, Star, TrendingUp, Calendar } from 'lucide-react';

const ICONS = {
  TOP_CREATOR: Trophy,
  NEW_FEATURE: Star,
  MILESTONE: TrendingUp,
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data.events)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 className="page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 48 }}>События</h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 80 }}>Загрузка...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Пока нет событий</h3>
            <p className="empty-state-text">Следите за новостями платформы!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map(event => {
              const Icon = ICONS[event.type] || Star;
              return (
                <div key={event.id} style={{ display: 'flex', gap: 16, padding: 24, background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{event.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>{event.description}</p>
                    {event.entity && event.entityType === 'user' && (
                      <Link to={`/profile/${event.entity.username}`} style={{ fontSize: 13, color: 'var(--accent)' }}>@{event.entity.username}</Link>
                    )}
                    {event.entity && event.entityType === 'project' && (
                      <Link to={`/projects/${event.entity.id}`} style={{ fontSize: 13, color: 'var(--accent)' }}>{event.entity.title}</Link>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {new Date(event.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
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
