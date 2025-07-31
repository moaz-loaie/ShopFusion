import React from 'react';
import PropTypes from 'prop-types';
import styles from './StatsGrid.module.css';

const StatsGrid = ({ 
  children, 
  columns = 'auto-fit', 
  minWidth = '250px',
  gap = '1.5rem'
}) => {
  const gridStyle = {
    gridTemplateColumns: typeof columns === 'number' 
      ? `repeat(${columns}, 1fr)`
      : `repeat(${columns}, minmax(${minWidth}, 1fr))`,
    gap
  };

  return (
    <div className={styles.grid} style={gridStyle}>
      {children}
    </div>
  );
};

StatsGrid.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.oneOf(['auto-fit', 'auto-fill'])
  ]),
  minWidth: PropTypes.string,
  gap: PropTypes.string
};

export default StatsGrid;
