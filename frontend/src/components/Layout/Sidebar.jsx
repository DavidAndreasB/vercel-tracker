import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Tag,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/wallets',      label: 'Wallets',      icon: Wallet },
  { to: '/categories',   label: 'Categories',   icon: Tag },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(false)}
          style={{ display: mobileOpen ? 'flex' : undefined, position: 'absolute', top: '16px', right: '16px', left: 'auto' }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <span className="sidebar-logo-text">FinTrack</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              {user?.email || ''}
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
