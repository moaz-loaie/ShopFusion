import React from 'react';
import PropTypes from 'prop-types';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import styles from './TrendIndicator.module.css';

const TrendIndicator = ({ value, showIcon = true }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const displayValue = `${isPositive ? '+' : ''}${value}%`;

  return (
    <span className={`${styles.trend} ${isPositive ? styles.positive : isNegative ? styles.negative : styles.neutral}`}>
      {showIcon && (isPositive ? <FiArrowUp /> : isNegative ? <FiArrowDown /> : null)}
      <span>{displayValue}</span>
    </span>
  );
};

TrendIndicator.propTypes = {
  value: PropTypes.number.isRequired,
  showIcon: PropTypes.bool
};

export default TrendIndicator;
