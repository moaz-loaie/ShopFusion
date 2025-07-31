import React from 'react';
import DisputeRow from './DisputeRow';
import styles from '../../pages/Admin/AdminDisputesPage.module.css';

const DisputeTable = ({ disputes, onView, onResolve, onReject }) => (
  <div className={styles.tableWrapper}>
    <table className={styles.disputeTable}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Order</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Raised By</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {disputes.map((dispute) => (
          <DisputeRow
            key={dispute.id}
            dispute={dispute}
            onView={onView}
            onResolve={onResolve}
            onReject={onReject}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default DisputeTable;
