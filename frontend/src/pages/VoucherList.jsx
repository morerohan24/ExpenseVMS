import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Filter, Eye, Edit, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, getStatusBadgeClass, CATEGORIES, STATUS_OPTIONS, getCategoryIcon } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VoucherList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', page: 1 });
  const [deleteId, setDeleteId] = useState(null);

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
      params.append('limit', 10);

      const res = await api.get(`/vouchers?${params}`);
      setVouchers(res.data.vouchers);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await api.put(`/vouchers/${id}/submit`);
      toast.success('Voucher submitted for approval!');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit voucher');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft voucher?')) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher deleted');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getStatusBadge = (status) => (
    <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
  );

  const filterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-xl font-bold">My Vouchers</h2>
          <p className="text-sm text-muted" style={{ marginTop: '2px' }}>
            {pagination.total} voucher{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/vouchers/new')}>
          <PlusCircle size={16} /> New Voucher
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Search vouchers..."
            value={filters.search}
            onChange={(e) => filterChange('search', e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => filterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => filterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filters.search || filters.status || filters.category) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ search: '', status: '', category: '', page: 1 })}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg" />
          <p className="loading-text">Loading vouchers...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📋</div>
          <h3>No vouchers found</h3>
          <p>{filters.search || filters.status || filters.category
            ? 'Try adjusting your filters.'
            : 'Create your first expense voucher to get started.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/vouchers/new')}>
            <PlusCircle size={16} /> Create Voucher
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span style={{
                        color: 'var(--primary-light)', fontWeight: 600,
                        fontFamily: 'monospace', fontSize: '0.78rem'
                      }}>
                        {v.voucherNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {v.title.length > 40 ? v.title.substring(0, 40) + '...' : v.title}
                      </div>
                      {v.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {v.description.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <span>{getCategoryIcon(v.category)}&nbsp;{v.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(v.amount, v.currency)}
                    </td>
                    <td>{formatDate(v.expenseDate)}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {v.submittedBy?.name || 'N/A'}
                        </span>
                        {v.submittedBy?.department && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {v.submittedBy.department}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/vouchers/${v.id}`)}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {v.status === 'Draft' && (v.submittedById === user?.id || user?.role === 'Admin') && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/vouchers/${v.id}/edit`)}
                              title="Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleSubmit(v.id)}
                              title="Submit for Approval"
                              style={{ color: 'var(--success)' }}
                            >
                              <Send size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDelete(v.id)}
                              title="Delete"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => filterChange('page', pagination.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => filterChange('page', p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => filterChange('page', pagination.page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VoucherList;
