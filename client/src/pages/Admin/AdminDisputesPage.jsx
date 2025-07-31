import React, { useEffect, useState, useCallback } from 'react';
import { adminGetAllDisputes } from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import DisputeTable from '../../components/Admin/DisputeTable';
import styles from './AdminDisputesPage.module.css';

const statusBadgeClass = (status) => `${styles.statusBadge} ${styles[status] || ''}`;

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: 'all',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const fetchDisputes = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { 
          page, 
          limit: pagination.limit,
          ...filters,
        };
        const res = await adminGetAllDisputes(params);
        setDisputes(res.data.data?.disputes || res.data.disputes || []);
        const totalItems = res.data.totalItems || 0;
        const limit = params.limit;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        setPagination({
          currentPage: res.data.currentPage || page,
          totalPages,
          totalItems,
          limit,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load disputes.');
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, filters],
  );

  useEffect(() => {
    fetchDisputes(1);
  }, [fetchDisputes]);

  const handlePageChange = (page) => {
    fetchDisputes(page);
  };

  // Placeholder handlers for actions
  const handleView = (dispute) => {
    setSelectedDispute(dispute);
    setShowModal(true);
  };  const handleResolve = async (dispute) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await adminUpdateDisputeStatus(dispute.id, {
        status: 'resolved',
        resolution_details: 'Dispute resolved in favor of the customer.'
      });
      await fetchDisputes(pagination.currentPage);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (dispute) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await adminUpdateDisputeStatus(dispute.id, {
        status: 'rejected',
        resolution_details: 'Dispute rejected after review.'
      });
      await fetchDisputes(pagination.currentPage);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Resolve Disputes</h1>
        <p>Review and resolve disputes between customers and sellers. Update status as needed.</p>
      </header>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status:</label>
          <select 
            className={styles.filterSelect}
            name="status"
            value={filters.status}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              fetchDisputes(1);
            }}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Priority:</label>
          <select 
            className={styles.filterSelect}
            name="priority"
            value={filters.priority}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, priority: e.target.value }));
              fetchDisputes(1);
            }}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Time Period:</label>
          <select 
            className={styles.filterSelect}
            name="dateRange"
            value={filters.dateRange}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, dateRange: e.target.value }));
              fetchDisputes(1);
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading disputes...
          </div>
        ) : error ? (
          <div className={styles.statusMsg} role="alert">
            {error}
          </div>
        ) : disputes.length === 0 ? (
          <div className={styles.emptyState}>No disputes found.</div>
        ) : (
          <DisputeTable
            disputes={disputes}
            onView={handleView}
            onResolve={handleResolve}
            onReject={handleReject}
          />
        )}
      </div>
      {/* Always show pagination if more than one page */}
      <div className={styles.paginationWrapper}>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      {/* Modal for viewing dispute details */}
      {showModal && selectedDispute && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" tabIndex={-1}>
          <div className={styles.modalContent}>
            <h2>Dispute Details</h2>
            <div className={styles.modalPre} style={{ background: 'none', padding: 0 }}>
              <div>
                <strong>ID:</strong> {selectedDispute.id}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={`${styles.statusBadge} ${styles[selectedDispute.status] || ''}`}>
                  {selectedDispute.status?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <strong>Priority:</strong>{' '}
                <span className={`${styles.priorityBadge} ${styles[selectedDispute.priority] || ''}`}>
                  {selectedDispute.priority}
                </span>
              </div>
              <div>
                <strong>Order ID:</strong> {selectedDispute.order?.id || 'N/A'}
              </div>
              <div>
                <strong>Raised By:</strong> {selectedDispute.raisedBy?.full_name || 'N/A'}
              </div>
              <div>
                <strong>Date:</strong>{' '}
                {selectedDispute.createdAt
                  ? new Date(selectedDispute.createdAt).toLocaleString()
                  : 'N/A'}
              </div>
              <div style={{ margin: '1em 0' }}>
                <strong>Reason:</strong>
                <br />
                <span style={{ whiteSpace: 'pre-line' }}>{selectedDispute.dispute_reason}</span>
              </div>
              {selectedDispute.resolver && (
                <div>
                  <strong>Resolved By:</strong> {selectedDispute.resolver.full_name}
                </div>
              )}
              {selectedDispute.resolvedAt && (
                <div>
                  <strong>Resolved At:</strong>{' '}
                  {new Date(selectedDispute.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
            <button className={styles.actionBtn} onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      {actionLoading && <div className={styles.actionLoading}>Processing...</div>}
      {actionError && (
        <div className={styles.statusMsg} role="alert">
          {actionError}
        </div>
      )}
    </div>
  );
};

export default AdminDisputesPage;
