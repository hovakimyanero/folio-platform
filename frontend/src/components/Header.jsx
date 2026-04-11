import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, IconButton, Button } from './ui';
import { Search, Bell, Plus, Settings, LogOut, User, ChevronDown, Menu, X, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthDialog } from '../context/AuthDialogContext';
import { useToast } from '../context/ToastContext';
import AuthDialog from './AuthDialog';
import SearchDialog from './SearchDialog';

export default function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { open: authOpen, setOpen: setAuthOpen, initialMode: authInitialMode, openAuthDialog } = useAuthDialog();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

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
          {[['Лента', '/feed'], ['Проекты', '/projects'], ['Маркетплейс', '/marketplace'], ['Коллекции', '/collections'], ['Челленджи', '/challenges']].map(([label, to]) => (
            <Link
              key={label}
              to={to}
              style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)', transition: 'color 0.4s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <IconButton onClick={() => setSearchOpen(true)}>
            <Search size={16} color="var(--text-2)" />
          </IconButton>

          {user ? (
            <>
              <IconButton onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
                <Bell size={16} color="var(--text-2)" />
              </IconButton>

              <Button variant="primary" size="sm" onClick={() => navigate('/upload')} style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                <Plus size={16} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={user.avatar} fallback={user.displayName?.[0] || user.username[0]} size={32} />
                    <ChevronDown size={12} color="var(--text-3)" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)}>
                    <User size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/analytics')}>
                    <BarChart3 size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Аналитика
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Настройки
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} style={{ color: '#ff6b6b' }}>
                    <LogOut size={14} style={{ marginRight: 8, opacity: 0.5 }} /> Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openAuthDialog('login')}>Войти</Button>
              <Button variant="primary" size="sm" className="desktop-only" onClick={() => openAuthDialog('register')}>Регистрация</Button>
            </>
          )}
          <IconButton className="mobile-only" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={18} /> : <Menu size={18} />}
          </IconButton>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: 'rgba(11,11,13,0.95)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          {[['Лента', '/feed'], ['Проекты', '/projects'], ['Маркетплейс', '/marketplace'], ['Коллекции', '/collections'], ['Челленджи', '/challenges']].map(([label, to]) => (
            <Link key={label} to={to} onClick={() => setMobileMenu(false)} style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>{label}</Link>
          ))}
          {user && (
            <>
              <Link to={`/profile/${user.username}`} onClick={() => setMobileMenu(false)} style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>Профиль</Link>
              <Link to="/analytics" onClick={() => setMobileMenu(false)} style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>Аналитика</Link>
              <Link to="/settings" onClick={() => setMobileMenu(false)} style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>Настройки</Link>
              <button onClick={() => { handleLogout(); setMobileMenu(false); }} style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: '#ff6b6b' }}>Выйти</button>
            </>
          )}
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialMode={authInitialMode} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
