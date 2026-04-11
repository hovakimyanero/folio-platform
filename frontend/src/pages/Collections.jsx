import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Input, Label, Button, IconButton } from '../components/ui';
import * as DialogPrimitive from '@radix-ui/react-dialog';
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
          <h1 className="page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>Коллекции</h1>
          {user && <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Создать</Button>}
        </div>
        {collections.length === 0 ? (
          <div className="empty-state"><FolderOpen size={64} color="var(--text-3)" style={{ opacity: 0.2, margin: '0 auto 24px' }} /><h3 className="empty-state-title">Нет коллекций</h3><p className="empty-state-text">Создайте первую коллекцию и добавляйте проекты.</p></div>
        ) : (
          <div className="project-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
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

        <DialogPrimitive.Root open={createOpen} onOpenChange={setCreateOpen}>
          <DialogPrimitive.Portal><DialogPrimitive.Overlay className="rdx-dialog-overlay" /><DialogPrimitive.Content className="rdx-dialog-content" style={{ maxWidth: 400 }}>
            <DialogPrimitive.Close asChild><IconButton style={{ position: 'absolute', top: 14, right: 14 }}><X size={14} /></IconButton></DialogPrimitive.Close>
            <DialogPrimitive.Title className="rdx-dialog-title">Новая коллекция</DialogPrimitive.Title>
            <Label>Название</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Моя коллекция" style={{ marginBottom: 24 }} />
            <Button variant="primary" onClick={createCollection} style={{ width: '100%' }}>Создать</Button>
          </DialogPrimitive.Content></DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </div>
  );
}
