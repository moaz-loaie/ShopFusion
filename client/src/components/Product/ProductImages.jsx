import React, { useState } from 'react';
import styles from './ProductImages.module.css';

const fallbackImg = '/assets/placeholder.png';

const ProductImages = ({ images = [], productName }) => {
  const validImages = images.filter((img) => img && (img.url || typeof img === 'string'));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const mainImg = validImages[selectedIdx]?.url || validImages[selectedIdx] || fallbackImg;

  const handleImgError = (e) => {
    e.target.src = fallbackImg;
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        <img
          className={styles.mainImage}
          src={mainImg}
          alt={productName || 'Product image'}
          onError={handleImgError}
        />
      </div>
      {validImages.length > 1 && (
        <div className={styles.thumbnails}>
          {validImages.map((img, i) => (
            <img
              key={i}
              className={
                i === selectedIdx ? `${styles.thumbnail} ${styles.selected}` : styles.thumbnail
              }
              src={img.url || img}
              alt={`Thumbnail ${i + 1}`}
              onClick={() => setSelectedIdx(i)}
              onError={handleImgError}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
