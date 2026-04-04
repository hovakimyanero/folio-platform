import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Trophy, Clock, Users, Medal } from 'lucide-react';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenge, setChallenge] = useState(null);

  useEffect(() => { api.get(`/challenges/${id}`).then(({ data }) => setChallenge(data.challenge)).catch(() => {}); }, [id]);

  if (!challenge) return <div style={{ minHeight: '100vh', paddingTop: 200, textAlign: 'center', color: 'var(--text-3)' }}>Загрузка...</div>;

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 20 }}>Challenge</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', marginBottom: 16 }}>{challenge.title}</h1>
        <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 40 }}>{challenge.description}</p>
        {challenge.rules && <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--glass)', border: '1px solid var(--glass-border)', marginBottom: 40, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}><strong>Правила:</strong><br />{challenge.rules}</div>}

        <div style={{ display: 'flex', gap: 24, marginBottom: 48, fontSize: 14, color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> {challenge.entries?.length || 0} участников</span>
        </div>

        {/* Entries */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 24 }}>Участники</h2>
        {(!challenge.entries || challenge.entries.length === 0) ? (
          <div className="empty-state"><h3 className="empty-state-title">Пока нет участников</h3><p className="empty-state-text">Станьте первым участником!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challenge.entries.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: entry.isWinner ? '1px solid var(--accent)' : '1px solid var(--glass-border)' }}>
                <span style={{ width: 32, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: entry.isWinner ? 'var(--accent)' : 'var(--text-3)' }}>
                  {entry.isWinner ? <Medal size={20} /> : `#${i + 1}`}
                </span>
                <Link to={`/projects/${entry.project?.id}`} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{entry.project?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{entry.user?.username}</div>
                </Link>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{Math.round(entry.score)} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
