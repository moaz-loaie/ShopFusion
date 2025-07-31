/**
 * Get elapsed time string from a given date
 * @param {Date} date - The date to calculate elapsed time from
 * @returns {string} - Formatted elapsed time string
 */
exports.getTimeElapsed = (date) => {
  const now = new Date();
  const elapsed = now - new Date(date);
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'just now';
};

/**
 * Format a date to a localized string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
