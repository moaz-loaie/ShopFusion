import React from 'react';
import PropTypes from 'prop-types';

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  trendLabel,
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {(trend || trendValue) && (
        <div className="mt-4 flex items-center text-sm">
          <span className={trendColors[trend]}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'} 
            {trendValue}
          </span>
          {trendLabel && (
            <span className="text-gray-500 ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendValue: PropTypes.string,
  trendLabel: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info'])
};
