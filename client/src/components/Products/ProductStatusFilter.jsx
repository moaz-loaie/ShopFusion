import React from 'react';
import PropTypes from 'prop-types';

export const ProductStatusFilter = ({ currentStatus, onStatusChange, userRole }) => {
  const statuses = [
    { value: 'all', label: 'All Products' },
    { value: 'approved', label: 'Approved' },
    ...(userRole !== 'customer' ? [
      { value: 'pending', label: 'Pending' },
      { value: 'rejected', label: 'Rejected' }
    ] : [])
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {statuses.map(status => (
        <button
          key={status.value}
          onClick={() => onStatusChange(status.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${currentStatus === status.value
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

ProductStatusFilter.propTypes = {
  currentStatus: PropTypes.oneOf(['all', 'approved', 'pending', 'rejected']).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  userRole: PropTypes.oneOf(['admin', 'seller', 'customer']).isRequired
};
