'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShoppingCart extends Model {
    static associate(models) {
      // A cart belongs to one Customer (User)
      ShoppingCart.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
      // A cart can have many CartItems
      ShoppingCart.hasMany(models.CartItem, { foreignKey: 'cart_id', as: 'items', onDelete: 'CASCADE' }); // Delete items if cart deleted
    }
  }
  ShoppingCart.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Each customer has only one active cart
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE' // Delete cart if customer deleted
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'ShoppingCart',
    tableName: 'ShoppingCarts',
    timestamps: true,
  });
  return ShoppingCart;
};