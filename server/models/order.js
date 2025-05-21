'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'orderItems', onDelete: 'CASCADE' }); // Delete order items if order deleted
      Order.hasOne(models.Payment, { foreignKey: 'order_id', as: 'payment', onDelete: 'CASCADE' }); // Delete payment if order deleted
      Order.hasOne(models.Shipping, { foreignKey: 'order_id', as: 'shipping', onDelete: 'CASCADE' }); // Delete shipping if order deleted
      Order.hasMany(models.Dispute, { foreignKey: 'order_id', as: 'disputes' }); // Order can have disputes
    }
  }
  Order.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'RESTRICT' // Prevent deleting user if they have orders? Or SET NULL? Business decision.
    },
    order_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    order_status: {
      type: DataTypes.ENUM('processing', 'shipped', 'delivered', 'cancelled', 'pending_payment'), // Added pending_payment
      allowNull: false, defaultValue: 'pending_payment',
      validate: { isIn: { args: [['processing', 'shipped', 'delivered', 'cancelled', 'pending_payment']], msg: 'Invalid order status.' } }
    },
    total_amount: { // Calculated total, should match sum of order items + shipping/taxes
      type: DataTypes.FLOAT, allowNull: false,
      validate: { isFloat: true, min: { args: [0], msg: 'Total amount cannot be negative.' } }
    },
    // Consider adding fields like shipping_address_snapshot, billing_address_snapshot if needed
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
    timestamps: true,
  });
  return Order;
};