import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, X, FolderOpen } from 'lucide-react';

export default function Collections() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { api.get('/collections').then(({ data }) => setCollections(data.collections)).catch(() => {}); }, []);

  const createCollection = async () => {
    if (!name.trim()) return;
    try { const { data } = await api.post('/collections', { name }); setCollections(prev => [data.collection, ...prev]); setName(''); setCreateOpen(false); showToast('Коллекция создана', 'success'); } catch { showToast('Ошибка', 'error'); }
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Коллекции</h1>
          {user && <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Создать</button>}
        </div>
        {collections.length === 0 ? (
          <div className="empty-state"><FolderOpen size={64} color="var(--text-3)" style={{ opacity: 0.2, margin: '0 auto 24px' }} /><h3 className="empty-state-title">Нет коллекций</h3><p className="empty-state-text">Создайте первую коллекцию и добавляйте проекты.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {collections.map(c => (
              <Link key={c.id} to={`/collections/${c.id}`} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--glass-border)', height: 240, position: 'relative', display: 'block' }}>
                {c.cover && <img src={c.cover} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} alt="" />}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, background: c.cover ? 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c._count?.items || 0} проектов</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Portal><Dialog.Overlay /><Dialog.Content style={{ width: 'min(400px, 90vw)', padding: 40 }}>
            <Dialog.Close asChild><button className="btn-icon" style={{ position: 'absolute', top: 14, right: 14 }}><X size={14} /></button></Dialog.Close>
            <Dialog.Title style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 24 }}>Новая коллекция</Dialog.Title>
            <label className="input-label">Название</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Моя коллекция" style={{ marginBottom: 24 }} />
            <button className="btn btn-primary" onClick={createCollection} style={{ width: '100%' }}>Создать</button>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
