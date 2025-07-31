import React from 'react';
import PropTypes from 'prop-types';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, trend, description, icon: Icon }) => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {Icon && <Icon className={styles.icon} />}
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        {trend && (
          <div className={styles.trend}>
            <span className={`${styles.trendValue} ${trend > 0 ? styles.positive : styles.negative}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>
      {description && (
        <p className={styles.description}>{description}</p>
      )}
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.number,
  description: PropTypes.string,
  icon: PropTypes.elementType
};

export default StatsCard;
