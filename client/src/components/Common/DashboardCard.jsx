import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './DashboardCard.module.css';

const DashboardCard = ({ 
  title, 
  value, 
  status, 
  trend,
  action,
  subtitle,
  icon 
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.content}>
        <p className={styles.value}>{value}</p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {status && status.length > 0 && (
          <div className={styles.statusList}>
            {status.map((item, index) => (
              <div 
                key={index} 
                className={`${styles.statusItem} ${styles[`color${item.color}`]}`}
              >
                {item.value && (
                  <span className={styles.statusValue}>{item.value}</span>
                )}
                <span className={styles.statusLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {trend && (
          <div className={`${styles.trend} ${styles[trend.direction]}`}>
            <span className={styles.trendIcon}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            </span>
            <span className={styles.trendValue}>
              {trend.value}%
            </span>
            {trend.label && (
              <span className={styles.trendLabel}>{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {action && (
        <Link 
          to={action.link} 
          className={styles.action}
          title={action.tooltip}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string.isRequired
  })),
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down', 'neutral']).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string
  }),
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    tooltip: PropTypes.string
  }),
  subtitle: PropTypes.string,
  icon: PropTypes.node
};

export default DashboardCard;
