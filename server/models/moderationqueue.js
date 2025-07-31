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
        foreignKey: 'admin_id',
        as: 'adminReviewer',
        constraints: false // Allow admin_id to be null if not yet reviewed
      });
    }
  }

  ModerationQueue.init({
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true, 
      allowNull: false 
    },
    product_id: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      unique: true,
      references: { model: 'Products', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false, 
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'approved', 'rejected']],
          msg: 'Invalid moderation status.'
        }
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ModerationQueue',
    tableName: 'ModerationQueue',
    timestamps: true,
    indexes: [
      { fields: ['product_id'], unique: true },
      { fields: ['status'] },
      { fields: ['admin_id'] }
    ],
    hooks: {
      beforeUpdate: async (instance) => {
        // Set reviewed_at timestamp when status changes from pending
        if (instance.changed('status') && instance.status !== 'pending') {
          instance.reviewed_at = new Date();
        }
      }
    },
    scopes: {
      byStatus(status) {
        return {
          where: { status }
        };
      },
      bySeller(sellerId) {
        return {
          include: [{
            model: sequelize.models.Product,
            as: 'product',
            where: { seller_id: sellerId }
          }]
        };
      }
    }
  });
  
  return ModerationQueue;
};