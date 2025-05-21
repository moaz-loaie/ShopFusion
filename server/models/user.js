'use strict';
const { Model } = require('sequelize');
const { hashPassword } = require('../utils/passwordUtils');
const logger = require('../utils/logger');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.ShoppingCart, { foreignKey: 'customer_id', as: 'shoppingCart', onDelete: 'CASCADE' });
      User.hasMany(models.Order, { foreignKey: 'customer_id', as: 'orders' }); // Consider implications of user deletion on orders
      User.hasMany(models.Product, { foreignKey: 'seller_id', as: 'listedProducts', onDelete: 'CASCADE' });
      User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews', onDelete: 'SET NULL', hooks: true }); // Set review user_id to null if user deleted
      User.hasMany(models.ReviewVote, { foreignKey: 'user_id', as: 'reviewVotes', onDelete: 'CASCADE' });
      User.hasMany(models.ModerationQueue, { foreignKey: 'admin_id', as: 'moderatedItems' }); // Admin role only
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: {
      type: DataTypes.STRING, allowNull: false, unique: { name: 'users_email_uk', msg: 'Email address already in use.' },
      validate: { isEmail: { msg: 'Must be a valid email address.' }, notNull: { msg: 'Email cannot be empty.' }, notEmpty: { msg: 'Email cannot be empty.' } }
    },
    full_name: {
      type: DataTypes.STRING, allowNull: false,
      validate: { notNull: { msg: 'Full name cannot be empty.' }, notEmpty: { msg: 'Full name cannot be empty.' }, len: { args: [2, 100], msg: 'Full name must be between 2 and 100 characters.' } }
    },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('customer', 'seller', 'admin'), allowNull: false, defaultValue: 'customer',
      validate: { isIn: { args: [['customer', 'seller', 'admin']], msg: 'Invalid user role specified.' } }
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true, // Enable createdAt, updatedAt
    paranoid: false, // Set to true if you want soft deletes (adds deletedAt column)
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await hashPassword(user.password_hash);
        } else {
            logger.error(`Attempted to create user ${user.email} without a password.`);
            throw new Error('Password is required for user creation.'); // Prevent creation without password
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash') && user.password_hash) {
           // Assume controller passed the plain password here for update scenario
           user.password_hash = await hashPassword(user.password_hash);
        } else if (user.changed('password_hash') && !user.password_hash) {
             logger.error(`Attempted to update user ${user.email} to have an empty password.`);
             // Revert change or throw error - cannot set password to null/empty
             user.password_hash = user.previous('password_hash'); // Revert
             throw new Error('Password cannot be set to empty.');
        }
      }
    }
  });

  // Instance method to remove password hash from JSON output
  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};