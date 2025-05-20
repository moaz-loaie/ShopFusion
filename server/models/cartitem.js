'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      // A cart item belongs to one ShoppingCart
      CartItem.belongsTo(models.ShoppingCart, { foreignKey: 'cart_id', as: 'cart' });
      // A cart item refers to one Product
      CartItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    }
  }
  CartItem.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cart_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'ShoppingCarts', key: 'id' },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Products', key: 'id' },
      onDelete: 'CASCADE' // Remove item if product deleted
    },
    quantity: {
      type: DataTypes.INTEGER, allowNull: false,
      validate: { isInt: true, min: { args: [1], msg: 'Quantity must be at least 1.' } }
    },
    // Store the price at the time the item was added. Useful if product prices change.
    unit_price: {
        type: DataTypes.FLOAT, allowNull: false, // Store price when added
        validate: { isFloat: true, min: { args: [0.01], msg: 'Unit price must be positive.' } }
    }
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'CartItem',
    tableName: 'CartItems',
    timestamps: true,
    // Add a unique constraint to prevent multiple entries for the same product in the same cart
    indexes: [
        {
            unique: true,
            fields: ['cart_id', 'product_id'],
            name: 'cart_items_cart_product_uk' // Unique key name
        }
    ]
  });
  return CartItem;
};