"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.ShoppingCart, {
        foreignKey: "customer_id",
        as: "shoppingCart",
      });
      User.hasMany(models.Order, { foreignKey: "customer_id", as: "orders" });
      User.hasMany(models.Product, {
        foreignKey: "seller_id",
        as: "listedProducts",
      }); // Only if role is 'seller'
      User.hasMany(models.Review, { foreignKey: "user_id", as: "reviews" });
      User.hasMany(models.ReviewVote, {
        foreignKey: "user_id",
        as: "reviewVotes",
      });
      User.hasMany(models.ModerationQueue, {
        foreignKey: "admin_id",
        as: "moderatedItems",
      }); // Only if role is 'admin'
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      full_name: { type: DataTypes.STRING, allowNull: false },
      password_hash: { type: DataTypes.STRING, allowNull: false }, // Store hash, not plain password
      role: {
        type: DataTypes.ENUM("customer", "seller", "admin"),
        allowNull: false,
        defaultValue: "customer",
      },
      // Sequelize handles createdAt and updatedAt by default
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
