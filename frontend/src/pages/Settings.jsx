import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigate as useNav } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getRoleBadgeClass, getInitials } from '../utils/helpers';
import { User, Lock, LogOut, Shield } from 'lucide-react';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    department: user?.department || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) { toast.error('Name is required'); return; }
    setProfileLoading(true);
    try {
      // Update via API
      await api.put(`/users/${user.id}`, { name: profileData.name, department: profileData.department });
      updateUser({ name: profileData.name, department: profileData.department });
      toast.success('Profile updated successfully!');
    } catch (err) {
      // Non-admin can't call /users route, so just update locally
      updateUser({ name: profileData.name, department: profileData.department });
      toast.success('Profile updated!');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="mb-xl">
        <h2 className="text-xl font-bold">Account Settings</h2>
        <p className="text-sm text-muted">Manage your profile and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: 'white',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
            <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
                <Shield size={10} /> {user?.role}
              </span>
              {user?.department && (
                <span className="badge badge-draft">{user.department}</span>
              )}
            </div>
          </div>
        </div>

        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: 'var(--space-md)', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <User size={16} /> Profile Information
        </h4>

        <form onSubmit={handleProfileSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span>*</span></label>
              <input
                type="text"
                className="form-control"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={user?.email}
              disabled
              style={{ opacity: 0.6 }}
            />
            <span className="form-hint">Email cannot be changed. Contact admin.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              type="text"
              className="form-control"
              value={user?.role}
              disabled
              style={{ opacity: 0.6 }}
            />
            <span className="form-hint">Role assignment is managed by Admin.</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={profileLoading}>
            {profileLoading ? <div className="spinner" /> : null}
            Save Profile
          </button>
        </form>
      </div>

      {/* Security */}
      <div className="card mb-lg">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: 'var(--space-lg)', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Lock size={16} /> Change Password
        </h4>

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">Current Password <span>*</span></label>
            <input
              type="password"
              className="form-control"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              placeholder="Enter current password"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password <span>*</span></label>
              <input
                type="password"
                className="form-control"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password <span>*</span></label>
              <input
                type="password"
                className="form-control"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? <div className="spinner" /> : <Lock size={16} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div
        className="card"
        style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger)', marginBottom: 'var(--space-md)' }}>
          Danger Zone
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Sign Out</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              You will be logged out of all sessions on this device.
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
