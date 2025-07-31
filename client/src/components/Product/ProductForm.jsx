import React, { useState } from 'react';
import styles from './ProductForm.module.css';

const ProductForm = ({ onSubmit, loading, error, initialValues = {} }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [price, setPrice] = useState(initialValues.price || '');
  const [stock_quantity, setStockQuantity] = useState(initialValues.stock_quantity || 1);
  const [category_id, setCategoryId] = useState(initialValues.category_id || '');
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !description || !price || !category_id) return;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock_quantity', stock_quantity);
    formData.append('category_id', category_id);
    images.forEach((img, i) => formData.append('images', img));
    onSubmit(formData);
  };

  return (
    <form className={styles.productForm} onSubmit={handleSubmit} encType="multipart/form-data">
      <h2 className={styles.title}>Upload New Product</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formGroup}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className={styles.formGroup}>
        <label>Price</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label>Stock Quantity</label>
        <input
          type="number"
          min="1"
          value={stock_quantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label>Category</label>
        <input
          value={category_id}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          placeholder="Category ID"
        />
      </div>
      <div className={styles.formGroup}>
        <label>Images</label>
        <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      </div>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Product'}
      </button>
    </form>
  );
};

export default ProductForm;
