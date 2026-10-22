import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VoucherList from './pages/VoucherList';
import VoucherForm from './pages/VoucherForm';
import VoucherDetail from './pages/VoucherDetail';
import Approvals from './pages/Approvals';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import AllVouchers from './pages/AllVouchers';

// Layout wrapper for authenticated routes
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome to ExpenseVMS' },
  '/vouchers': { title: 'My Vouchers', subtitle: 'View and manage your expense vouchers' },
  '/vouchers/new': { title: 'New Voucher', subtitle: 'Create a new expense voucher' },
  '/approvals': { title: 'Approvals', subtitle: 'Review and approve expense vouchers' },
  '/payments': { title: 'Payment Processing', subtitle: 'Process approved voucher payments' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Expense insights and trends' },
  '/users': { title: 'User Management', subtitle: 'Manage system users and roles' },
  '/audit-logs': { title: 'Audit Logs', subtitle: 'System activity and change history' },
  '/all-vouchers': { title: 'All Vouchers', subtitle: 'Complete voucher registry' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account preferences' },
};

const AuthenticatedLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageInfo = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || { title: 'ExpenseVMS', subtitle: '' };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Private routes */}
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
      <Route path="/vouchers" element={
        <PrivateRoute><VoucherList /></PrivateRoute>
      } />
      <Route path="/vouchers/new" element={
        <PrivateRoute><VoucherForm /></PrivateRoute>
      } />
      <Route path="/vouchers/:id" element={
        <PrivateRoute><VoucherDetail /></PrivateRoute>
      } />
      <Route path="/vouchers/:id/edit" element={
        <PrivateRoute><VoucherForm /></PrivateRoute>
      } />
      <Route path="/approvals" element={
        <PrivateRoute roles={['Manager', 'Admin', 'Finance']}><Approvals /></PrivateRoute>
      } />
      <Route path="/payments" element={
        <PrivateRoute roles={['Finance', 'Admin']}><Payments /></PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute roles={['Manager', 'Admin', 'Finance']}><Reports /></PrivateRoute>
      } />
      <Route path="/users" element={
        <PrivateRoute roles={['Admin']}><UserManagement /></PrivateRoute>
      } />
      <Route path="/audit-logs" element={
        <PrivateRoute roles={['Admin']}><AuditLogs /></PrivateRoute>
      } />
      <Route path="/all-vouchers" element={
        <PrivateRoute roles={['Admin', 'Finance']}><AllVouchers /></PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute><Settings /></PrivateRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
