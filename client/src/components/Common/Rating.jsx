import React from 'react';

const getStarIcons = (value, starSize = 'small') => {
  const stars = [];
  const size = starSize === 'large' ? 28 : starSize === 'medium' ? 22 : 16;
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(
        <span key={i} style={{ color: '#f59e42', fontSize: size, marginRight: 2 }}>
          ★
        </span>,
      );
    } else if (value >= i - 0.5) {
      stars.push(
        <span key={i} style={{ color: '#f59e42', fontSize: size, marginRight: 2 }}>
          ☆
        </span>,
      );
    } else {
      stars.push(
        <span key={i} style={{ color: '#e5e7eb', fontSize: size, marginRight: 2 }}>
          ★
        </span>,
      );
    }
  }
  return stars;
};

const Rating = ({ value = 0, text = '', starSize = 'small' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {getStarIcons(value, starSize)}
    {text && <span style={{ marginLeft: 6, fontSize: 14, color: '#555' }}>{text}</span>}
  </div>
);

export default Rating;
