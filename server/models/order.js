'use strict';
const { Model } = require('sequelize');
const { calculateOrderTotal } = require('../utils/orderUtils');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Customer relationship
      Order.belongsTo(models.User, { 
        foreignKey: 'customer_id', 
        as: 'customer',
        onDelete: 'RESTRICT' // Prevent customer deletion if they have orders
      });
      
      // Order items relationship with cascade delete
      Order.hasMany(models.OrderItem, { 
        foreignKey: 'order_id', 
        as: 'orderItems', 
        onDelete: 'CASCADE' 
      });
      
      // Payment relationship with cascade delete
      Order.hasOne(models.Payment, { 
        foreignKey: 'order_id', 
        as: 'payment', 
        onDelete: 'CASCADE' 
      });
      
      // Shipping relationship with cascade delete
      Order.hasOne(models.Shipping, { 
        foreignKey: 'order_id', 
        as: 'shipping', 
        onDelete: 'CASCADE' 
      });
      
      // Disputes relationship
      Order.hasMany(models.Dispute, { 
        foreignKey: 'order_id', 
        as: 'disputes' 
      });
    }
  }
  
  Order.init({
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    customer_id: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    order_date: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    order_status: {
      type: DataTypes.ENUM('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending_payment',
      validate: {
        isIn: {
          args: [['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled']],
          msg: 'Invalid order status.'
        }
      }
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: { args: [0], msg: 'Total amount cannot be negative.' },
        isMatchingItemsTotal: async function(value) {
          if (this.orderItems) {
            const calculatedTotal = calculateOrderTotal(this.orderItems);
            if (Math.abs(calculatedTotal - value) > 0.01) { // Allow for small float rounding differences
              throw new Error('Total amount does not match sum of order items');
            }
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
    timestamps: true,
    hooks: {
      beforeCreate: async (order, options) => {
        // Set order date if not set
        if (!order.order_date) {
          order.order_date = new Date();
        }
      }
    }
  });

  return Order;
};