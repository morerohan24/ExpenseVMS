import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Filter } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, getStatusBadgeClass, CATEGORIES, STATUS_OPTIONS, getCategoryIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

const AllVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', page: 1 });

  useEffect(() => {
    fetchVouchers();
  }, [filters]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      params.append('page', filters.page);
      params.append('limit', 15);

      const res = await api.get(`/vouchers?${params}`);
      setVouchers(res.data.vouchers);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const filterChange = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-xl font-bold">All Vouchers</h2>
          <p className="text-sm text-muted">{pagination.total} total vouchers in the system</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, number..."
            value={filters.search}
            onChange={(e) => filterChange('search', e.target.value)}
          />
        </div>
        <select className="filter-select" value={filters.status} onChange={(e) => filterChange('status', e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filters.category} onChange={(e) => filterChange('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filters.search || filters.status || filters.category) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', category: '', page: 1 })}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Title</th>
                <th>Employee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Approved By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No vouchers found
                  </td>
                </tr>
              ) : vouchers.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)' }}>{v.voucherNumber}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '200px' }}>
                    {v.title.length > 40 ? v.title.substring(0, 40) + '...' : v.title}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 500 }}>{v.submittedBy?.name}</span>
                      {v.submittedBy?.department && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.submittedBy.department}</div>
                      )}
                    </div>
                  </td>
                  <td>{getCategoryIcon(v.category)}&nbsp;{v.category}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(v.amount, v.currency)}</td>
                  <td>{formatDate(v.expenseDate)}</td>
                  <td><span className={`badge ${getStatusBadgeClass(v.status)}`}>{v.status}</span></td>
                  <td>{v.approvedBy?.name || '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/vouchers/${v.id}`)}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn ${p === pagination.page ? 'active' : ''}`}
              onClick={() => filterChange('page', p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllVouchers;
