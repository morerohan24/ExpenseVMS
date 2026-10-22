import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import api from '../utils/api';
import { CATEGORIES, PAYMENT_METHODS, CURRENCIES } from '../utils/helpers';
import toast from 'react-hot-toast';

const VoucherForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    expenseDate: new Date().toISOString().split('T')[0],
    currency: 'INR',
    paymentMethod: '',
  });
  const [file, setFile] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isEdit) fetchVoucher();
  }, [id]);

  const fetchVoucher = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vouchers/${id}`);
      const v = res.data.voucher;
      if (v.status !== 'Draft') {
        toast.error('Only draft vouchers can be edited');
        navigate(`/vouchers/${id}`);
        return;
      }
      setFormData({
        title: v.title,
        description: v.description || '',
        amount: v.amount,
        category: v.category,
        expenseDate: v.expenseDate,
        currency: v.currency,
        paymentMethod: v.paymentMethod || '',
      });
      if (v.receiptPath) setExistingReceipt(v.receiptPath);
    } catch (err) {
      toast.error('Failed to load voucher');
      navigate('/vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(f);
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.keys(formData).forEach((key) => fd.append(key, formData[key]));
    if (file) fd.append('receipt', file);
    return fd;
  };

  const validate = () => {
    if (!formData.title.trim()) { toast.error('Title is required'); return false; }
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount'); return false;
    }
    if (!formData.category) { toast.error('Category is required'); return false; }
    if (!formData.expenseDate) { toast.error('Expense date is required'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const fd = buildFormData();
      if (isEdit) {
        await api.put(`/vouchers/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Voucher updated!');
      } else {
        const res = await api.post('/vouchers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Voucher saved as draft!');
        navigate(`/vouchers/${res.data.voucher.id}`);
        return;
      }
      navigate(`/vouchers/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save voucher');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (!validate()) return;
    setSubmitLoading(true);
    try {
      const fd = buildFormData();
      let voucherId = id;
      if (isEdit) {
        await api.put(`/vouchers/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const res = await api.post('/vouchers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        voucherId = res.data.voucher.id;
      }
      await api.put(`/vouchers/${voucherId}/submit`);
      toast.success('Voucher submitted for approval! 🚀');
      navigate(`/vouchers/${voucherId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit voucher');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading voucher...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="flex items-center gap-md mb-xl">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {isEdit ? 'Edit Voucher' : 'New Expense Voucher'}
          </h1>
          <p className="text-sm text-muted">
            {isEdit ? 'Update your draft expense voucher' : 'Fill in the details to create a new expense voucher'}
          </p>
        </div>
      </div>

      <div className="card">
        {/* Basic Info */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--primary-light)' }}>
            📋 Basic Information
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Voucher Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-control"
              placeholder="e.g. Business Trip to Mumbai - October 2026"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              placeholder="Provide details about this expense..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
            />
            <span className="form-hint">{formData.description.length}/500 characters</span>
          </div>
        </div>

        {/* Amount & Category */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--primary-light)' }}>
            💰 Expense Details
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem'
                }}>
                  {CURRENCIES.find((c) => c.code === formData.currency)?.symbol || '₹'}
                </span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currency">Currency</label>
              <select id="currency" name="currency" className="form-control" value={formData.currency} onChange={handleChange}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select id="category" name="category" className="form-control" value={formData.category} onChange={handleChange}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="paymentMethod">Payment Method</label>
              <select id="paymentMethod" name="paymentMethod" className="form-control" value={formData.paymentMethod} onChange={handleChange}>
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '260px' }}>
            <label className="form-label" htmlFor="expenseDate">
              Expense Date <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              className="form-control"
              value={formData.expenseDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Receipt Upload */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--primary-light)' }}>
            📎 Receipt / Attachment
          </h3>

          {existingReceipt && !file && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              background: 'var(--success-light)', borderRadius: 'var(--radius)',
              border: '1px solid rgba(16,185,129,0.2)', marginBottom: '12px'
            }}>
              <FileText size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}>Existing receipt attached</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {existingReceipt}
              </span>
            </div>
          )}

          <label
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            htmlFor="receipt-upload"
            style={{ cursor: 'pointer' }}
          >
            <input
              id="receipt-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                  {file.type.includes('pdf') ? '📄' : '🖼️'}
                </div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginTop: '8px', color: 'var(--danger)' }}
                  onClick={(e) => { e.preventDefault(); setFile(null); }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="upload-zone-icon">📤</div>
                <p>
                  <span>Click to upload</span> or drag & drop
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>JPG, PNG, GIF, PDF (max 5MB)</p>
              </div>
            )}
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSave}
            disabled={saveLoading || submitLoading}
          >
            {saveLoading ? <><div className="spinner" /> Saving...</> : <><Save size={16} /> Save Draft</>}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveAndSubmit}
            disabled={saveLoading || submitLoading}
          >
            {submitLoading ? <><div className="spinner" /> Submitting...</> : <><Send size={16} /> Save & Submit</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherForm;
