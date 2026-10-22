import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getCategoryIcon } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Approvals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    fetchVouchers();
  }, [filter]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filter) params.append('status', filter);
      const res = await api.get(`/vouchers?${params}`);
      // Filter out employee's own vouchers for managers
      const filteredVouchers = res.data.vouchers.filter(v => 
        user?.role !== 'Employee' || v.submittedById !== user?.id
      );
      setVouchers(res.data.vouchers);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (v) => {
    setActionLoading(`approve-${v.id}`);
    try {
      await api.put(`/vouchers/${v.id}/approve`, { comment: approveComment });
      toast.success(`Voucher "${v.title}" approved! ✅`);
      setShowApproveModal(null);
      setApproveComment('');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (v) => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading(`reject-${v.id}`);
    try {
      await api.put(`/vouchers/${v.id}/reject`, { reason: rejectReason });
      toast.success(`Voucher rejected`);
      setShowRejectModal(null);
      setRejectReason('');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading('');
    }
  };

  const pendingCount = vouchers.filter(v => v.status === 'Pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-xl font-bold">Approval Queue</h2>
          <p className="text-sm text-muted" style={{ marginTop: '2px' }}>
            {pendingCount > 0 ? `${pendingCount} voucher${pendingCount !== 1 ? 's' : ''} awaiting your approval` : 'No pending approvals'}
          </p>
        </div>
        <div className="flex gap-sm">
          {['Pending', 'Approved', 'Rejected'].map((s) => (
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

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">✅</div>
          <h3>No {filter.toLowerCase()} vouchers</h3>
          <p>All caught up! No vouchers require your attention.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="card"
              style={{
                border: v.status === 'Pending' ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                      {v.voucherNumber}
                    </span>
                    <span className={`badge badge-${v.status.toLowerCase()}`}>{v.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{v.title}</h3>
                  {v.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {v.description.substring(0, 100)}{v.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>👤 <strong>{v.submittedBy?.name}</strong> ({v.submittedBy?.department})</span>
                    <span>{getCategoryIcon(v.category)} {v.category}</span>
                    <span>📅 {formatDate(v.expenseDate)}</span>
                    {v.submittedAt && <span>🕒 Submitted {formatDateTime(v.submittedAt)}</span>}
                  </div>
                  {v.rejectionReason && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#f87171' }}>
                      ❌ Rejection reason: {v.rejectionReason}
                    </div>
                  )}
                  {v.approverComment && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#34d399' }}>
                      💬 {v.approverComment}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(v.amount, v.currency)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vouchers/${v.id}`)}>
                      <Eye size={14} /> View
                    </button>
                    {v.status === 'Pending' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setShowApproveModal(v)}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setShowRejectModal(v)}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">✅ Approve Voucher</h2>
              <button className="btn btn-ghost" onClick={() => { setShowApproveModal(null); setApproveComment(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{showApproveModal.title}</strong><br />
                Amount: <strong style={{ color: 'var(--success)' }}>{formatCurrency(showApproveModal.amount, showApproveModal.currency)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Add approval notes..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleApprove(showApproveModal)}>
                <CheckCircle size={16} /> Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">❌ Reject Voucher</h2>
              <button className="btn btn-ghost" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                Rejecting: <strong style={{ color: 'var(--text-primary)' }}>{showRejectModal.title}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="form-control"
                  placeholder="Please explain why this voucher is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim()}
              >
                <XCircle size={16} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
