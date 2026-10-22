import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Eye, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getCategoryIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

const Payments = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Approved');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, [filter]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vouchers?status=${filter}&limit=50`);
      setVouchers(res.data.vouchers);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (v) => {
    if (!window.confirm(`Mark "${v.title}" as paid? Amount: ${formatCurrency(v.amount, v.currency)}`)) return;
    setActionLoading(v.id);
    try {
      await api.put(`/vouchers/${v.id}/pay`);
      toast.success('Voucher marked as Paid! 💸');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setActionLoading('');
    }
  };

  const totalAmount = vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-xl font-bold">Payment Processing</h2>
          <p className="text-sm text-muted" style={{ marginTop: '2px' }}>
            {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-sm">
          {['Approved', 'Paid'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      {filter === 'Approved' && vouchers.length > 0 && (
        <div
          className="card mb-lg"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Pending Payment
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vouchers Ready
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{vouchers.length}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">💰</div>
          <h3>No {filter.toLowerCase()} vouchers</h3>
          <p>
            {filter === 'Approved'
              ? 'No approved vouchers pending payment processing.'
              : 'No paid vouchers found.'}
          </p>
        </div>
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
                <th>Approved By</th>
                {filter === 'Paid' && <th>Paid At</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                    {v.voucherNumber}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {v.title.length > 35 ? v.title.substring(0, 35) + '...' : v.title}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 500 }}>{v.submittedBy?.name}</span>
                      {v.submittedBy?.department && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.submittedBy.department}</div>
                      )}
                    </div>
                  </td>
                  <td>{getCategoryIcon(v.category)}&nbsp;{v.category}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                    {formatCurrency(v.amount, v.currency)}
                  </td>
                  <td>{formatDate(v.expenseDate)}</td>
                  <td>{v.approvedBy?.name || '—'}</td>
                  {filter === 'Paid' && <td>{formatDateTime(v.paidAt)}</td>}
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/vouchers/${v.id}`)}>
                        <Eye size={14} />
                      </button>
                      {filter === 'Approved' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePay(v)}
                          disabled={actionLoading === v.id}
                        >
                          {actionLoading === v.id ? <div className="spinner" /> : <DollarSign size={14} />}
                          Pay
                        </button>
                      )}
                      {filter === 'Paid' && (
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Paid
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
