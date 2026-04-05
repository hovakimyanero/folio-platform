import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Search, Bell, Plus, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthDialog from './AuthDialog';
import SearchDialog from './SearchDialog';

export default function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cmd+K for search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Вы вышли из аккаунта');
    navigate('/');
  };

  return (
    <>
      <header
        className="header-inner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: scrolled ? '12px 48px' : '20px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
          background: scrolled ? 'rgba(11,11,13,0.6)' : 'transparent',
          backdropFilter: scrolled ? 'blur(40px) saturate(1.8)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(40px) saturate(1.8)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '-0.02em' }}>
          Folio<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        <nav className="header-nav" style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          {['Explore', 'Trending', 'Collections', 'Creators', 'Challenges'].map(item => (
            <Link
              key={item}
              to={item === 'Explore' ? '/projects' : item === 'Trending' ? '/projects?sort=trending' : item === 'Creators' ? '/search?type=users' : `/${item.toLowerCase()}`}
              style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)', transition: 'color 0.4s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
            >
              {item}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-icon" onClick={() => setSearchOpen(true)}>
            <Search size={16} color="var(--text-2)" />
          </button>

          {user ? (
            <>
              <button className="btn-icon" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
                <Bell size={16} color="var(--text-2)" />
              </button>

              <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
                <Plus size={14} /> Upload
              </button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar.Root style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <Avatar.Image src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Avatar.Fallback style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', color: 'var(--text-2)', fontSize: 13 }}>
                        {user.displayName?.[0] || user.username[0]}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <ChevronDown size={12} color="var(--text-3)" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content sideOffset={8} align="end">
                    <DropdownMenu.Item onClick={() => navigate(`/profile/${user.username}`)}>
                      <User size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Профиль
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => navigate('/settings')}>
                      <Settings size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Настройки
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                    <DropdownMenu.Item onClick={handleLogout} style={{ color: '#ff6b6b' }}>
                      <LogOut size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Выйти
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => { setAuthOpen(true); }}>Войти</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthOpen(true); }}>Регистрация</button>
            </>
          )}
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
