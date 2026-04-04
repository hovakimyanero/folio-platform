import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Trophy, Clock, Users } from 'lucide-react';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  useEffect(() => { api.get('/challenges').then(({ data }) => setChallenges(data.challenges)).catch(() => {}); }, []);

  const timeLeft = (deadline) => {
    const d = new Date(deadline) - new Date();
    if (d <= 0) return 'Завершён';
    const days = Math.floor(d / 864e5);
    const hours = Math.floor((d % 864e5) / 36e5);
    return `${days}д ${hours}ч`;
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 48 }}>Челленджи</h1>
        {challenges.length === 0 ? (
          <div className="empty-state"><Trophy size={64} color="var(--text-3)" style={{ opacity: 0.2, margin: '0 auto 24px' }} /><h3 className="empty-state-title">Нет активных челленджей</h3><p className="empty-state-text">Скоро появятся новые конкурсы.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {challenges.map(c => (
              <Link key={c.id} to={`/challenges/${c.id}`} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)', padding: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.4s' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: c.isActive ? 'var(--accent)' : 'var(--text-3)', marginBottom: 12 }}>{c.isActive ? 'Активный' : 'Завершён'}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={13} /> {timeLeft(c.deadline)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> {c._count?.entries || 0} участников</span>
                  </div>
                </div>
                <button className="btn btn-primary">{c.isActive ? 'Участвовать' : 'Результаты'}</button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
