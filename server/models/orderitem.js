"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
      OrderItem.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "RESTRICT",
      });
    }
  }
  OrderItem.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Orders", key: "id" },
        onDelete: "CASCADE",
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Products", key: "id" },
        onDelete: "RESTRICT",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
          min: { args: [1], msg: "Quantity must be at least 1." },
        },
      },
      unit_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          isFloat: true,
          min: { args: [0], msg: "Unit price cannot be negative." },
        },
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "OrderItems",
      timestamps: true,
      indexes: [{ fields: ["order_id"] }, { fields: ["product_id"] }],
    }
  );
  return OrderItem;
};
