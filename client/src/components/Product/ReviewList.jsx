import React from 'react';
import Rating from '../Common/Rating';
import styles from './ReviewList.module.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const ReviewList = ({ reviews, onVote, userId }) => (
  <div className={styles.reviewList}>
    {reviews && reviews.length > 0 ? (
      <ul className={styles.reviewItems}>
        {reviews.map((r) => (
          <li key={r.id} className={styles.reviewItem}>
            <div className={styles.reviewHeader}>
              <span className={styles.reviewerName}>{r.User?.full_name || 'Anonymous'}</span>
              <Rating value={r.rating || 0} size="sm" />
              <span className={styles.reviewDate}>{formatDate(r.createdAt)}</span>
            </div>
            <div className={styles.reviewText}>{r.review_text || 'No review text.'}</div>
            <div className={styles.reviewVotes}>
              <button
                className={r.userVote === 'helpful' ? styles.voteActive : styles.voteBtn}
                onClick={() => onVote && onVote(r.id, 'helpful')}
                disabled={!onVote || r.userVote === 'helpful'}
                aria-label="Mark as helpful"
              >
                👍 {r.voteCounts?.helpful || 0}
              </button>
              <button
                className={r.userVote === 'not_helpful' ? styles.voteActive : styles.voteBtn}
                onClick={() => onVote && onVote(r.id, 'not_helpful')}
                disabled={!onVote || r.userVote === 'not_helpful'}
                aria-label="Mark as not helpful"
              >
                👎 {r.voteCounts?.notHelpful || 0}
              </button>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.noReviews}>No reviews found.</p>
    )}
  </div>
);

export default ReviewList;
