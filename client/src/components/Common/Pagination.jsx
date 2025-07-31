import React from 'react';
import styles from './Pagination.module.css';

/**
 * Production-ready Pagination component.
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback(pageNumber)
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Helper to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          '...',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) onPageChange(page);
  };

  return (
    <nav className={styles.paginationNav} aria-label="Pagination">
      <ul className={styles.paginationList}>
        <li>
          <button
            className={styles.paginationButton}
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            «
          </button>
        </li>
        <li>
          <button
            className={styles.paginationButton}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ‹
          </button>
        </li>
        {getPageNumbers().map((page, idx) => (
          <li key={idx}>
            {page === '...' ? (
              <span className={styles.paginationEllipsis} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                className={
                  page === currentPage
                    ? `${styles.paginationButton} ${styles.active}`
                    : styles.paginationButton
                }
                onClick={() => handlePageClick(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={page === currentPage ? `Page ${page}, current` : `Go to page ${page}`}
                tabIndex={0}
                disabled={page === currentPage}
              >
                {page}
              </button>
            )}
          </li>
        ))}
        <li>
          <button
            className={styles.paginationButton}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </li>
        <li>
          <button
            className={styles.paginationButton}
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            »
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
