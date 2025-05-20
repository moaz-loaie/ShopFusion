'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      // A Review belongs to one Product
      Review.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE'
      });
      // A Review belongs to one User (customer)
      Review.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'User', // Alias for the user who wrote the review
        onDelete: 'SET NULL', // Keep review if user is deleted, but set user_id to null
        hooks: true
      });
      // A Review can have many ReviewVotes
      Review.hasMany(models.ReviewVote, {
        foreignKey: 'review_id',
        as: 'votes',
        onDelete: 'CASCADE' // Delete votes if review is deleted
      });
    }
  }
  Review.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    product_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Products', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER, allowNull: true, // Allow null if user is deleted
      references: { model: 'Users', key: 'id' }
    },
    rating: {
      type: DataTypes.INTEGER, allowNull: false,
      validate: {
        isInt: { msg: 'Rating must be an integer.' },
        min: { args: [1], msg: 'Rating must be at least 1 star.' },
        max: { args: [5], msg: 'Rating cannot exceed 5 stars.' }
      }
    },
    review_text: {
      type: DataTypes.TEXT, // Allow longer review text
      allowNull: false,
      validate: {
        notNull: { msg: 'Review text is required.' },
        notEmpty: { msg: 'Review text cannot be empty.' },
        len: { args: [5, 2000], msg: 'Review text must be between 5 and 2000 characters.' }
      }
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'Reviews',
    timestamps: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['user_id'] },
      // Unique constraint to prevent a user from reviewing the same product multiple times
      { unique: true, fields: ['product_id', 'user_id'], name: 'reviews_product_user_uk' }
    ]
  });
  return Review;
};