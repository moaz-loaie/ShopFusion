'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shipping extends Model {
    static associate(models) {
      // Shipping details belong to one Order
      Shipping.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
        onDelete: 'CASCADE'
      });
    }
  }
  Shipping.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    order_id: {
      type: DataTypes.INTEGER, allowNull: false, unique: true, // One shipping record per order
      references: { model: 'Orders', key: 'id' }
    },
    shipping_address: { // Could be a JSON object or stringified address
      type: DataTypes.TEXT, allowNull: false,
      validate: {
        notNull: { msg: 'Shipping address is required.' },
        notEmpty: { msg: 'Shipping address cannot be empty.' }
      }
    },
    shipping_status: { // e.g., 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery'
      type: DataTypes.STRING, allowNull: false, defaultValue: 'processing', // Initial status when order is placed
      validate: {
          isIn: {
            args: [['processing', 'label_created', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned']],
            msg: 'Invalid shipping status.'
          }
      }
    },
    shipped_date: {
      type: DataTypes.DATE,
      allowNull: true // Null until actually shipped
    },
    expected_delivery: {
      type: DataTypes.DATE,
      allowNull: true // Null until an estimate is available
    },
    tracking_number: { // Optional: Store carrier tracking number
        type: DataTypes.STRING,
        allowNull: true
    },
    carrier: { // Optional: Store shipping carrier
        type: DataTypes.STRING,
        allowNull: true
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'Shipping',
    tableName: 'Shipping',
    timestamps: true,
    indexes: [
      { fields: ['order_id'], unique: true },
      { fields: ['shipping_status'] },
      { fields: ['tracking_number'] } // If tracking number is often searched
    ]
  });
  return Shipping;
};