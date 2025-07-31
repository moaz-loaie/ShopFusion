import React, { useState } from 'react';
import styles from './ReviewForm.module.css';

const ReviewForm = ({ onSubmit, initialRating = 0 }) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (!rating || !comment.trim()) {
      setError('Please provide a rating and a comment.');
      setLoading(false);
      return;
    }
    try {
      // Backend expects 'review_text', not 'comment'
      await onSubmit({ rating, review_text: comment });
      setSuccess('Review submitted!');
      setComment('');
      setRating(0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.reviewFormContainer} onSubmit={handleSubmit}>
      <div className={styles.reviewFormTitle}>Write a Review</div>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      <div className={styles.formGroup}>
        <label className={styles.label}>Rating</label>
        <select
          className={styles.select}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={loading}
        >
          <option value={0}>Select rating</option>
          <option value={5}>★★★★★</option>
          <option value={4}>★★★★☆</option>
          <option value={3}>★★★☆☆</option>
          <option value={2}>★★☆☆☆</option>
          <option value={1}>★☆☆☆☆</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Comment</label>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          disabled={loading}
        />
      </div>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
