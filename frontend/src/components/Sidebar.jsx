import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, CheckSquare, Users,
  BarChart3, Settings, LogOut, ClipboardList, X, DollarSign,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      section: 'Main',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/vouchers', icon: FileText, label: 'My Vouchers', roles: ['Employee', 'Manager', 'Admin', 'Finance'] },
        { to: '/vouchers/new', icon: PlusCircle, label: 'New Voucher', roles: ['Employee', 'Manager', 'Admin', 'Finance'] },
      ],
    },
    {
      section: 'Management',
      items: [
        { to: '/approvals', icon: CheckSquare, label: 'Approvals', roles: ['Manager', 'Admin', 'Finance'] },
        { to: '/payments', icon: DollarSign, label: 'Payments', roles: ['Finance', 'Admin'] },
        { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['Manager', 'Admin', 'Finance'] },
      ],
    },
    {
      section: 'Admin',
      items: [
        { to: '/users', icon: Users, label: 'User Management', roles: ['Admin'] },
        { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', roles: ['Admin'] },
        { to: '/all-vouchers', icon: ShieldCheck, label: 'All Vouchers', roles: ['Admin', 'Finance'] },
      ],
    },
    {
      section: 'Account',
      items: [
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const hasAccess = (roles) => {
    if (!roles) return true;
    return roles.includes(user?.role);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99, display: 'block', background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">💰</div>
          <span className="logo-text">ExpenseVMS</span>
          <button
            className="btn btn-ghost"
            style={{ marginLeft: 'auto', display: 'none' }}
            onClick={onClose}
            id="sidebar-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => {
            const visibleItems = section.items.filter((item) => hasAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-section" key={section.section}>
                <div className="nav-section-label">{section.section}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <item.icon className="nav-icon" size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} title="Logout">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role} · {user?.department || 'N/A'}</div>
            </div>
            <LogOut size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
