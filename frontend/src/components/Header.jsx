import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, subtitle, onMenuToggle, actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <button
        className="btn btn-ghost"
        onClick={onMenuToggle}
        style={{ display: 'none', marginRight: '4px' }}
        id="menu-toggle-btn"
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {actions}
        <button className="btn btn-ghost" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '8px', height: '8px', background: 'var(--danger)',
            borderRadius: '50%', border: '2px solid var(--bg-primary)',
          }} />
        </button>
        <button className="btn btn-ghost" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #menu-toggle-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
