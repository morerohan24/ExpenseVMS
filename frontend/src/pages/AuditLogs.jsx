import React, { useState, useEffect } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { formatDateTime, getRoleBadgeClass } from '../utils/helpers';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
  USER_REGISTERED: '👤 User Registered',
  USER_LOGIN: '🔑 User Login',
  USER_CREATED_BY_ADMIN: '➕ User Created',
  USER_UPDATED: '✏️ User Updated',
  USER_DELETED: '🗑️ User Deleted',
  PASSWORD_CHANGED: '🔐 Password Changed',
  VOUCHER_CREATED: '📄 Voucher Created',
  VOUCHER_UPDATED: '✏️ Voucher Updated',
  VOUCHER_SUBMITTED: '📤 Voucher Submitted',
  VOUCHER_APPROVED: '✅ Voucher Approved',
  VOUCHER_REJECTED: '❌ Voucher Rejected',
  VOUCHER_PAID: '💸 Voucher Paid',
  VOUCHER_DELETED: '🗑️ Voucher Deleted',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/audit-logs?page=${page}&limit=20`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-md mb-lg">
        <ClipboardList size={22} style={{ color: 'var(--primary-light)' }} />
        <div>
          <h2 className="text-xl font-bold">Audit Logs</h2>
          <p className="text-sm text-muted">{pagination.total} total events recorded</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner spinner-lg" /></div>
      ) : logs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📋</div>
          <h3>No audit logs yet</h3>
          <p>System events will appear here.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Entity</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>System</span>
                      )}
                    </td>
                    <td>
                      {log.user ? (
                        <span className={`badge ${getRoleBadgeClass(log.user.role)}`}>{log.user.role}</span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                        {log.entityType}{log.entityId ? `#${log.entityId}` : ''}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ padding: '0 12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                className="pagination-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
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

export default AuditLogs;
