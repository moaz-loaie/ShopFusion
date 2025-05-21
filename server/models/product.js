'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.User, { foreignKey: 'seller_id', as: 'Seller' });
      Product.belongsTo(models.ProductCategory, { foreignKey: 'category_id', as: 'Category' });
      Product.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'Images', onDelete: 'CASCADE' });
      Product.hasMany(models.Review, { foreignKey: 'product_id', as: 'Reviews', onDelete: 'CASCADE' }); // Delete reviews if product deleted
      Product.hasMany(models.CartItem, { foreignKey: 'product_id', as: 'cartItems' });
      Product.hasMany(models.OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
      Product.hasOne(models.ModerationQueue, { foreignKey: 'product_id', as: 'moderationStatus', onDelete: 'CASCADE' }); // Delete moderation status if product deleted
    }
  }
  Product.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    seller_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    category_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'ProductCategories', key: 'id' } },
    name: {
      type: DataTypes.STRING, allowNull: false,
      validate: { notNull: { msg: 'Product name required.' }, notEmpty: { msg: 'Product name required.' }, len: { args: [3, 200], msg: 'Name must be 3-200 chars.' } }
    },
    description: {
      type: DataTypes.TEXT, allowNull: false,
      validate: { notNull: { msg: 'Description required.' }, notEmpty: { msg: 'Description required.' } }
    },
    price: {
      type: DataTypes.FLOAT, allowNull: false,
      validate: { isFloat: true, min: { args: [0.01], msg: 'Price must be positive.' } }
    },
    stock_quantity: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
      validate: { isInt: true, min: { args: [0], msg: 'Stock cannot be negative.' } }
    },
    preview_image_url: {
      type: DataTypes.STRING(2048),
      validate: { isUrl: { msg: 'Invalid image URL format.', require_protocol: true } }
    },
    // Optional: Add calculated fields like averageRating, reviewCount if denormalizing
    // averageRating: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0, max: 5 } },
    // reviewCount: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
  });
  return Product;
};