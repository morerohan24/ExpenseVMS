import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#84cc16', '#f97316'];

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/vouchers/analytics');
      setAnalytics(res.data.analytics);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading reports...</p>
      </div>
    );
  }

  const statusData = [
    { name: 'Draft', value: analytics?.counts?.draft || 0, color: '#64748b' },
    { name: 'Pending', value: analytics?.counts?.pending || 0, color: '#f59e0b' },
    { name: 'Approved', value: analytics?.counts?.approved || 0, color: '#10b981' },
    { name: 'Rejected', value: analytics?.counts?.rejected || 0, color: '#ef4444' },
    { name: 'Paid', value: analytics?.counts?.paid || 0, color: '#6366f1' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="mb-xl">
        <h2 className="text-xl font-bold mb-sm">Reports & Analytics</h2>
        <p className="text-muted text-sm">Comprehensive expense analysis and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid mb-xl">
        {[
          { label: 'Total Vouchers', value: analytics?.counts?.total || 0, icon: '📄', color: '#6366f1' },
          { label: 'Total Approved', value: formatCurrency(analytics?.amounts?.totalApproved || 0), icon: '✅', color: '#10b981' },
          { label: 'Total Paid', value: formatCurrency(analytics?.amounts?.totalPaid || 0), icon: '💸', color: '#6366f1' },
          { label: 'Pending Amount', value: formatCurrency(analytics?.amounts?.totalPending || 0), icon: '⏳', color: '#f59e0b' },
          { label: 'Approval Rate', value: (() => {
            const total = (analytics?.counts?.approved || 0) + (analytics?.counts?.rejected || 0);
            return total > 0 ? `${Math.round(((analytics?.counts?.approved || 0) / total) * 100)}%` : 'N/A';
          })(), icon: '📊', color: '#06b6d4' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="stat-card"
            style={{ '--card-accent': `linear-gradient(90deg, ${kpi.color}, ${kpi.color}99)` }}
          >
            <div className="stat-icon" style={{ background: `${kpi.color}15`, fontSize: '22px' }}>{kpi.icon}</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{kpi.value}</div>
            <div className="stat-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid mb-xl">
        {/* Monthly Trend */}
        {analytics?.monthlyData?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Expense Trend</div>
                <div className="card-subtitle">Total vs Approved vs Pending</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="total" name="Total" stroke="#6366f1" fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" fill="url(#colorApproved)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {statusData.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Status Distribution</div>
                <div className="card-subtitle">Vouchers by current status</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {analytics?.categoryBreakdown?.length > 0 && (
        <div className="card mb-xl">
          <div className="card-header">
            <div>
              <div className="card-title">Expense by Category</div>
              <div className="card-subtitle">Voucher count per category</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.categoryBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {analytics.categoryBreakdown.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Reports;
