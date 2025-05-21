'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      OrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product', onDelete: 'RESTRICT' }); // Prevent product deletion if in orders? Or SET NULL?
    }
  }
  OrderItem.init({
     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: 'Orders', key: 'id' },
        onDelete: 'CASCADE' // Delete item if order is deleted
    },
    product_id: {
        type: DataTypes.INTEGER, allowNull: false, // Could be nullable if product is deleted later and we want to keep order history
        references: { model: 'Products', key: 'id' },
        onDelete: 'RESTRICT' // Or SET NULL if product can be deleted but order item should remain
    },
    quantity: {
      type: DataTypes.INTEGER, allowNull: false,
      validate: { isInt: true, min: { args: [1], msg: 'Quantity must be at least 1.' } }
    },
    // Store price at the time of order for historical accuracy
    unit_price: {
      type: DataTypes.FLOAT, allowNull: false,
      validate: { isFloat: true, min: { args: [0], msg: 'Unit price cannot be negative.' } } // Price could be 0 for free items? Allow >= 0
    },
    // Optional: Store product name/sku snapshot in case product details change/delete
    // product_name_snapshot: { type: DataTypes.STRING },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'OrderItems',
    timestamps: true, // Usually false for junction/detail tables unless creation time matters
    indexes: [
        { fields: ['order_id'] }, // Index foreign keys
        { fields: ['product_id'] }
    ]
  });
  return OrderItem;
};