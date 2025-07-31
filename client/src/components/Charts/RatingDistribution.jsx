import React from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './RatingDistribution.module.css';

const RatingDistribution = ({ distribution }) => {
  // Transform distribution object into array format for chart
  const data = Object.entries(distribution).map(([rating, count]) => ({
    rating: `${rating}★`,
    count,
    fill: rating >= 4 ? '#22c55e' : rating >= 3 ? '#f59e0b' : '#ef4444'
  }));

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { rating, count } = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipRating}>{rating}</p>
          <p className={styles.tooltipCount}>
            {count} {count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      );
    }
    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array
  };

  return (
    <div className={styles.chartContainer}>
      <h3>Rating Distribution</h3>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="rating"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

RatingDistribution.propTypes = {
  distribution: PropTypes.shape({
    1: PropTypes.number.isRequired,
    2: PropTypes.number.isRequired,
    3: PropTypes.number.isRequired,
    4: PropTypes.number.isRequired,
    5: PropTypes.number.isRequired
  }).isRequired
};

export default RatingDistribution;
