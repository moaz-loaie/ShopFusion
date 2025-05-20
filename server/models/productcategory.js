'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    static associate(models) {
      // A category can have many Products
      ProductCategory.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
    }
  }
  ProductCategory.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING, allowNull: false, unique: { name: 'product_categories_name_uk', msg: 'Category name must be unique.' },
      validate: { notNull: { msg: 'Category name required.' }, notEmpty: { msg: 'Category name required.' }, len: { args: [2, 100], msg: 'Name must be 2-100 chars.' } }
    },
    description: {
      type: DataTypes.TEXT, // Use TEXT for longer descriptions
      validate: { len: { args: [0, 1000], msg: 'Description cannot exceed 1000 characters.' } } // Optional length validation
    },
    thumbnail_url: {
      type: DataTypes.STRING(2048), // Store URL
      validate: { isUrl: { msg: 'Invalid thumbnail URL format.', require_protocol: true } }
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'ProductCategory',
    tableName: 'ProductCategories',
    timestamps: true,
  });
  return ProductCategory;
};