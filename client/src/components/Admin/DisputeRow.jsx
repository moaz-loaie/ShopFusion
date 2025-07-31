import React from 'react';
import styles from '../../pages/Admin/AdminDisputesPage.module.css';

const DisputeRow = ({ dispute, onView, onResolve, onReject }) => (
  <tr>
    <td>{dispute.id}</td>
    <td>{dispute.order?.id}</td>
    <td>
      <span className={`${styles.statusBadge} ${styles[dispute.status] || ''}`}>
        {dispute.status?.replace('_', ' ')}
      </span>
    </td>
    <td>
      <span className={`${styles.priorityBadge} ${styles[dispute.priority] || ''}`}>
        {dispute.priority}
      </span>
    </td>
    <td>{dispute.raisedBy?.full_name}</td>
    <td>{new Date(dispute.createdAt).toLocaleDateString()}</td>
    <td className={styles.actionCell}>
      <button
        className={styles.actionBtn}
        onClick={() => onView(dispute)}
        aria-label="View details"
      >
        View
      </button>
      {dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
        <>
          <button
            className={styles.actionBtn}
            onClick={() => onResolve(dispute)}
            aria-label="Resolve"
          >
            Resolve
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onReject(dispute)}
            aria-label="Reject"
          >
            Reject
          </button>
        </>
      )}
    </td>
  </tr>
);

export default DisputeRow;
