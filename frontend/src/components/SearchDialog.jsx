import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchDialog({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onOpenChange(false);
      setQuery('');
    }
  };

  const suggestions = ['UI/UX Design', 'Branding & Identity', '3D & Motion', 'Web Design', 'Illustration'];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content style={{
          width: 'min(600px, 90vw)', padding: 0, top: '20%', transform: 'translateX(-50%)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <SearchIcon size={18} color="var(--text-3)" />
            <form onSubmit={handleSearch} style={{ flex: 1 }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск проектов, авторов, категорий..."
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 16, color: 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: 300,
                }}
              />
            </form>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { navigate(`/search?q=${encodeURIComponent(s)}`); onOpenChange(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 16px', borderRadius: 'var(--radius-xs)',
                  fontSize: 13, color: 'var(--text-2)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-2)'; }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{
            padding: '12px 24px', borderTop: '1px solid var(--glass-border)',
            fontSize: 11, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between',
          }}>
            <span><kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>ESC</kbd> закрыть</span>
            <span><kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>Enter</kbd> поиск</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
