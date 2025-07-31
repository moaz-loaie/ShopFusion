'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Seller relationship
      Product.belongsTo(models.User, { 
        foreignKey: 'seller_id', 
        as: 'Seller',
        onDelete: 'CASCADE' // Delete products when seller is deleted
      });
      
      // Category relationship
      Product.belongsTo(models.ProductCategory, { 
        foreignKey: 'category_id', 
        as: 'Category',
        onDelete: 'RESTRICT' // Prevent category deletion if it has products
      });
      
      // Product images with cascade delete
      Product.hasMany(models.ProductImage, { 
        foreignKey: 'product_id', 
        as: 'Images', 
        onDelete: 'CASCADE' 
      });
      
      // Reviews with cascade delete
      Product.hasMany(models.Review, { 
        foreignKey: 'product_id', 
        as: 'Reviews', 
        onDelete: 'CASCADE' 
      });
      
      // Cart items with cascade delete
      Product.hasMany(models.CartItem, { 
        foreignKey: 'product_id', 
        as: 'cartItems',
        onDelete: 'CASCADE'
      });
      
      // Order items - prevent product deletion if in orders
      Product.hasMany(models.OrderItem, { 
        foreignKey: 'product_id', 
        as: 'orderItems',
        onDelete: 'RESTRICT'
      });
      
      // Moderation queue with cascade delete
      Product.hasOne(models.ModerationQueue, { 
        foreignKey: 'product_id', 
        as: 'moderationStatus', 
        onDelete: 'CASCADE' 
      });
    }
  }
  
  Product.init({
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    seller_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    category_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'ProductCategories', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Product name required.' },
        notEmpty: { msg: 'Product name required.' },
        len: { args: [3, 200], msg: 'Name must be 3-200 chars.' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'Description required.' },
        notEmpty: { msg: 'Description required.' }
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: { args: [0.01], msg: 'Price must be positive.' }
      }
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: { args: [0], msg: 'Stock cannot be negative.' }
      }
    },
    preview_image_url: {
      type: DataTypes.STRING(2048),
      validate: {
        isUrl: { 
          msg: 'Invalid image URL format.',
          require_protocol: true 
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
    indexes: [
      { fields: ['seller_id'] },
      { fields: ['category_id'] },
      { fields: ['price'] },
      { fields: ['name'] }
    ]
  });

  return Product;
};