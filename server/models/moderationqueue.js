'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ModerationQueue extends Model {
    static associate(models) {
      // ModerationQueue item belongs to one Product
      ModerationQueue.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE' // If product is deleted, remove its moderation entry
      });
      // ModerationQueue item reviewed by one Admin (User)
      ModerationQueue.belongsTo(models.User, {
        foreignKey: 'admin_id', // User ID of the admin who reviewed
        as: 'adminReviewer',
        constraints: false // Optional: Allow admin_id to be null if not yet reviewed
      });
    }
  }
  ModerationQueue.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    product_id: {
      type: DataTypes.INTEGER, allowNull: false, unique: true, // One moderation entry per product
      references: { model: 'Products', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false, defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'approved', 'rejected']],
          msg: 'Invalid moderation status.'
        }
      }
    },
    feedback: { // Feedback from admin on rejection or notes for approval
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_id: { // ID of the admin who reviewed this item
      type: DataTypes.INTEGER,
      allowNull: true, // Null if not yet reviewed by an admin
      references: { model: 'Users', key: 'id' } // Admin must be a User
    },
    reviewed_at: { // Timestamp of when the review decision was made
      type: DataTypes.DATE,
      allowNull: true
    },
    // Timestamps (createdAt, updatedAt for the queue entry itself) managed by Sequelize
  }, {
    sequelize,
    modelName: 'ModerationQueue',
    tableName: 'ModerationQueue', // Ensure table name consistency
    timestamps: true,
    indexes: [
      { fields: ['product_id'], unique: true },
      { fields: ['status'] }, // For querying items by status
      { fields: ['admin_id'] }
    ]
  });
  return ModerationQueue;
};