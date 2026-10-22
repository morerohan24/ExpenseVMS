import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, DollarSign, Send, Edit, Trash2,
  FileText, ExternalLink, Clock, User
} from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass, getCategoryIcon } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VoucherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const fetchVoucher = async () => {
    try {
      const res = await api.get(`/vouchers/${id}`);
      setVoucher(res.data.voucher);
    } catch (err) {
      toast.error('Failed to load voucher');
      navigate('/vouchers');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = ['Manager', 'Admin', 'Finance'].includes(user?.role);
  const canPay = ['Finance', 'Admin'].includes(user?.role);
  const isOwner = voucher?.submittedById === user?.id;

  const handleSubmit = async () => {
    setActionLoading('submit');
    try {
      await api.put(`/vouchers/${id}/submit`);
      toast.success('Voucher submitted for approval!');
      fetchVoucher();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setActionLoading('');
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await api.put(`/vouchers/${id}/approve`, { comment: approveComment });
      toast.success('Voucher approved! ✅');
      setShowApproveModal(false);
      fetchVoucher();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading('reject');
    try {
      await api.put(`/vouchers/${id}/reject`, { reason: rejectReason });
      toast.success('Voucher rejected');
      setShowRejectModal(false);
      fetchVoucher();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading('');
    }
  };

  const handlePay = async () => {
    if (!window.confirm('Mark this voucher as Paid? This action cannot be undone.')) return;
    setActionLoading('pay');
    try {
      await api.put(`/vouchers/${id}/pay`);
      toast.success('Voucher marked as Paid! 💸');
      fetchVoucher();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft voucher? This cannot be undone.')) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher deleted');
      navigate('/vouchers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading voucher details...</p>
      </div>
    );
  }

  if (!voucher) return null;

  const statusSteps = [
    { key: 'Draft', label: 'Draft Created', date: voucher.createdAt, done: true },
    { key: 'Pending', label: 'Submitted for Approval', date: voucher.submittedAt, done: ['Pending', 'Approved', 'Rejected', 'Paid'].includes(voucher.status) },
    { key: 'Approved', label: voucher.status === 'Rejected' ? 'Rejected' : 'Approved', date: voucher.approvedAt || voucher.rejectedAt, done: ['Approved', 'Rejected', 'Paid'].includes(voucher.status), rejected: voucher.status === 'Rejected' },
    { key: 'Paid', label: 'Payment Processed', date: voucher.paidAt, done: voucher.status === 'Paid' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {/* Owner actions */}
          {voucher.status === 'Draft' && (isOwner || user?.role === 'Admin') && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vouchers/${id}/edit`)}>
                <Edit size={15} /> Edit
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmit}
                disabled={actionLoading === 'submit'}
              >
                {actionLoading === 'submit' ? <div className="spinner" /> : <Send size={15} />}
                Submit
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                onClick={handleDelete}
              >
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}

          {/* Approver actions */}
          {voucher.status === 'Pending' && canApprove && (
            <>
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowApproveModal(true)}
              >
                <CheckCircle size={15} /> Approve
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle size={15} /> Reject
              </button>
            </>
          )}

          {/* Finance - Mark as Paid */}
          {voucher.status === 'Approved' && canPay && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePay}
              disabled={actionLoading === 'pay'}
            >
              {actionLoading === 'pay' ? <div className="spinner" /> : <DollarSign size={15} />}
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div
        className="card mb-md"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <div className="voucher-detail-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`badge ${getStatusBadgeClass(voucher.status)}`} style={{ fontSize: '0.8rem' }}>
                {voucher.status}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                {voucher.voucherNumber}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>{voucher.title}</h1>
            {voucher.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>
                {voucher.description}
              </p>
            )}
          </div>
          <div className="voucher-amount">
            {formatCurrency(voucher.amount, voucher.currency)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
        {/* Main Details */}
        <div>
          {/* Details Grid */}
          <div className="card mb-md">
            <div className="card-header">
              <div className="card-title">Expense Details</div>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Category</div>
                <div className="detail-value">
                  {getCategoryIcon(voucher.category)}&nbsp;{voucher.category}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Expense Date</div>
                <div className="detail-value">{formatDate(voucher.expenseDate)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Currency</div>
                <div className="detail-value">{voucher.currency}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Payment Method</div>
                <div className="detail-value">{voucher.paymentMethod || '—'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Submitted By</div>
                <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--primary-light)' }} />
                  {voucher.submittedBy?.name}
                  {voucher.submittedBy?.department && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      · {voucher.submittedBy.department}
                    </span>
                  )}
                </div>
              </div>
              {voucher.approvedBy && (
                <div className="detail-item">
                  <div className="detail-label">
                    {voucher.status === 'Rejected' ? 'Rejected By' : 'Approved By'}
                  </div>
                  <div className="detail-value">{voucher.approvedBy?.name}</div>
                </div>
              )}
              <div className="detail-item">
                <div className="detail-label">Created At</div>
                <div className="detail-value">{formatDateTime(voucher.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Approver Notes */}
          {(voucher.approverComment || voucher.rejectionReason) && (
            <div
              className="card mb-md"
              style={{
                border: `1px solid ${voucher.status === 'Rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                background: voucher.status === 'Rejected' ? 'var(--danger-light)' : 'var(--success-light)',
              }}
            >
              <div className="card-title" style={{ marginBottom: '8px' }}>
                {voucher.status === 'Rejected' ? '❌ Rejection Reason' : '💬 Approver Comment'}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {voucher.rejectionReason || voucher.approverComment}
              </p>
            </div>
          )}

          {/* Receipt */}
          {voucher.receiptPath && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>📎 Receipt Attachment</div>
              {/\.(jpg|jpeg|png|gif)$/i.test(voucher.receiptPath) ? (
                <img
                  src={`/uploads/${voucher.receiptPath}`}
                  alt="Receipt"
                  style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: '300px', objectFit: 'contain' }}
                />
              ) : (
                <a
                  href={`/uploads/${voucher.receiptPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ gap: '8px' }}
                >
                  <FileText size={16} /> View PDF Receipt <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>
            <Clock size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-light)' }} />
            Timeline
          </div>
          <div className="timeline">
            {statusSteps.map((step, i) => (
              <div key={step.key} className="timeline-item">
                <div className={`timeline-dot ${step.rejected ? 'rejected' : step.done ? (i === statusSteps.filter(s => s.done).length - 1 ? 'active' : 'done') : 'pending'}`}>
                  {step.done ? (step.rejected ? '✕' : '✓') : '○'}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    color: step.done ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}>
                    {step.label}
                  </div>
                  {step.date && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDateTime(step.date)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">✅ Approve Voucher</h2>
              <button className="btn btn-ghost" onClick={() => setShowApproveModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Approving: <strong style={{ color: 'var(--text-primary)' }}>{voucher.title}</strong>
                <br />
                Amount: <strong style={{ color: 'var(--success)' }}>{formatCurrency(voucher.amount, voucher.currency)}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Add an approval comment..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading === 'approve'}>
                {actionLoading === 'approve' ? <div className="spinner" /> : <CheckCircle size={16} />}
                Approve
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
              <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Rejecting: <strong style={{ color: 'var(--text-primary)' }}>{voucher.title}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="form-control"
                  placeholder="Please provide a reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={actionLoading === 'reject' || !rejectReason.trim()}
              >
                {actionLoading === 'reject' ? <div className="spinner" /> : <XCircle size={16} />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherDetail;
