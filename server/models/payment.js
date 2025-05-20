'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // A Payment belongs to one Order
      Payment.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
        onDelete: 'CASCADE' // Delete payment if order is deleted
      });
    }
  }
  Payment.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    order_id: {
      type: DataTypes.INTEGER, allowNull: false, unique: true, // One payment record per order
      references: { model: 'Orders', key: 'id' }
    },
    payment_method: { // e.g., 'Credit Card', 'PayPal', 'Stripe Transaction ID'
      type: DataTypes.STRING, allowNull: false,
      validate: {
        notNull: { msg: 'Payment method is required.' },
        notEmpty: { msg: 'Payment method cannot be empty.' }
      }
    },
    amount: {
      type: DataTypes.FLOAT, allowNull: false,
      validate: {
        isFloat: { msg: 'Amount must be a number.' },
        min: { args: [0.01], msg: 'Payment amount must be positive.' } // Assuming payments can't be zero
      }
    },
    status: { // e.g., 'pending', 'succeeded', 'failed', 'refunded'
      type: DataTypes.STRING, allowNull: false, defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'succeeded', 'failed', 'refunded', 'processing']],
          msg: 'Invalid payment status.'
        }
      }
    },
    payment_date: {
      type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW
    },
    transaction_id: { // Optional: Store external payment gateway transaction ID
      type: DataTypes.STRING,
      unique: true // If present, should be unique
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      { fields: ['order_id'], unique: true },
      { fields: ['status'] },
      { fields: ['transaction_id'], unique: true, where: { transaction_id: { [DataTypes.Op.ne]: null } } } // Conditional unique index
    ]
  });
  return Payment;
};