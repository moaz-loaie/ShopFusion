'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      // A ProductImage belongs to one Product
      ProductImage.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE' // Delete image if product is deleted
      });
    }
  }
  ProductImage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products', // Table name
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING(2048), // Allow long URLs
      allowNull: false,
      validate: {
        notNull: { msg: 'Image URL is required.' },
        notEmpty: { msg: 'Image URL cannot be empty.' },
        isUrl: { msg: 'Must be a valid URL format.' }
      }
    },
    image_type: {
      type: DataTypes.ENUM('preview', 'thumbnail', 'gallery'),
      allowNull: false,
      defaultValue: 'gallery',
      validate: {
        isIn: {
          args: [['preview', 'thumbnail', 'gallery']],
          msg: 'Invalid image type. Must be preview, thumbnail, or gallery.'
        }
      }
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Display order must be an integer.' },
        min: { args: [0], msg: 'Display order cannot be negative.' }
      }
    },
    // Timestamps (createdAt, updatedAt) managed by Sequelize by default
  }, {
    sequelize,
    modelName: 'ProductImage',
    tableName: 'ProductImages',
    timestamps: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['product_id', 'display_order'] } // For ordering images of a product
    ]
  });
  return ProductImage;
};