import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileText, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#84cc16', '#f97316'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, vouchersRes] = await Promise.all([
        api.get('/vouchers/analytics'),
        api.get('/vouchers?limit=5'),
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setRecentVouchers(vouchersRes.data.vouchers);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Vouchers',
      value: analytics?.counts?.total || 0,
      icon: '📄',
      accent: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      iconBg: 'rgba(99,102,241,0.12)',
    },
    {
      label: 'Pending Approval',
      value: analytics?.counts?.pending || 0,
      icon: '⏳',
      accent: 'linear-gradient(90deg, #f59e0b, #d97706)',
      iconBg: 'rgba(245,158,11,0.12)',
      sub: `₹${formatCurrency(analytics?.amounts?.totalPending || 0).replace('₹', '')}`,
    },
    {
      label: 'Approved',
      value: analytics?.counts?.approved || 0,
      icon: '✅',
      accent: 'linear-gradient(90deg, #10b981, #059669)',
      iconBg: 'rgba(16,185,129,0.12)',
      sub: `₹${formatCurrency(analytics?.amounts?.totalApproved || 0).replace('₹', '')}`,
    },
    {
      label: 'Total Paid',
      value: analytics?.counts?.paid || 0,
      icon: '💸',
      accent: 'linear-gradient(90deg, #6366f1, #3b82f6)',
      iconBg: 'rgba(99,102,241,0.12)',
      sub: formatCurrency(analytics?.amounts?.totalPaid || 0),
    },
    {
      label: 'Rejected',
      value: analytics?.counts?.rejected || 0,
      icon: '❌',
      accent: 'linear-gradient(90deg, #ef4444, #dc2626)',
      iconBg: 'rgba(239,68,68,0.12)',
    },
    {
      label: 'Draft',
      value: analytics?.counts?.draft || 0,
      icon: '📝',
      accent: 'linear-gradient(90deg, #64748b, #475569)',
      iconBg: 'rgba(100,116,139,0.12)',
    },
  ];

  const getStatusBadge = (status) => {
    const config = {
      Draft: { class: 'badge-draft', label: 'Draft' },
      Pending: { class: 'badge-pending', label: 'Pending' },
      Approved: { class: 'badge-approved', label: 'Approved' },
      Rejected: { class: 'badge-rejected', label: 'Rejected' },
      Paid: { class: 'badge-paid', label: 'Paid' },
    };
    const cfg = config[status] || config.Draft;
    return <span className={`badge ${cfg.class}`}>{cfg.label}</span>;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="card mb-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.role} · {user?.department || 'N/A'} · Here's your expense overview for today
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/vouchers/new')}
          style={{ gap: '8px' }}
        >
          <PlusCircle size={16} />
          New Voucher
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={{ '--card-accent': stat.accent }}
          >
            <div className="stat-icon" style={{ background: stat.iconBg, fontSize: '22px' }}>
              {stat.icon}
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            {stat.sub && (
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
                {stat.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      {analytics?.monthlyData?.length > 0 || analytics?.categoryBreakdown?.length > 0 ? (
        <div className="charts-grid mb-xl">
          {/* Monthly Bar Chart */}
          {analytics?.monthlyData?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Monthly Expense Trend</div>
                  <div className="card-subtitle">Submitted vs Approved amount</div>
                </div>
                <TrendingUp size={20} style={{ color: 'var(--primary-light)' }} />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Pie Chart */}
          {analytics?.categoryBreakdown?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">By Category</div>
                  <div className="card-subtitle">Voucher distribution</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {analytics.categoryBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}

      {/* Recent Vouchers */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Vouchers</div>
            <div className="card-subtitle">Latest expense submissions</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/vouchers')}>
            View All
          </button>
        </div>

        {recentVouchers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No vouchers yet</h3>
            <p>Create your first expense voucher to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/vouchers/new')}>
              <PlusCircle size={16} /> Create Voucher
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map((v) => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--primary-light)', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {v.voucherNumber}
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {v.title.length > 35 ? v.title.substring(0, 35) + '...' : v.title}
                    </td>
                    <td>{v.category}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(v.amount, v.currency)}
                    </td>
                    <td>{formatDate(v.expenseDate)}</td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/vouchers/${v.id}`)}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
