'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model {
    static associate(models) {
      // A Dispute belongs to one Order
      Dispute.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
        onDelete: 'CASCADE' // If order is deleted, associated disputes are also removed
      });
      // Optional: A Dispute might be assigned to/resolved by a User (Admin)
      Dispute.belongsTo(models.User, {
        foreignKey: 'resolved_by_user_id', // ID of admin/staff who resolved it
        as: 'resolver',
        allowNull: true,
        constraints: false
      });
       // Optional: A Dispute is raised by a User (Customer)
      Dispute.belongsTo(models.User, {
        foreignKey: 'raised_by_user_id',
        as: 'raisedBy',
        allowNull: false, // A dispute must be raised by someone
        constraints: false // Avoid circular dependency issues if needed
      });
    }
  }
  Dispute.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    order_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Orders', key: 'id' }
    },
    raised_by_user_id: { // ID of the user (customer) who raised the dispute
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    dispute_reason: {
      type: DataTypes.TEXT, allowNull: false,
      validate: {
        notNull: { msg: 'Dispute reason is required.' },
        notEmpty: { msg: 'Dispute reason cannot be empty.' },
        len: {args: [10, 2000], msg: 'Reason must be between 10 and 2000 characters.'}
      }
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved', 'rejected', 'under_review'), // Added 'under_review'
      allowNull: false, defaultValue: 'open',
      validate: {
        isIn: {
          args: [['open', 'resolved', 'rejected', 'under_review']],
          msg: 'Invalid dispute status.'
        }
      }
    },
    resolution_details: { // Details of how the dispute was resolved
        type: DataTypes.TEXT,
        allowNull: true
    },
    resolved_by_user_id: { // ID of the admin/staff who handled the resolution
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' }
    },
    resolved_at: { // Timestamp of resolution
        type: DataTypes.DATE,
        allowNull: true
    }
    // Timestamps (createdAt, updatedAt for the dispute record itself) managed by Sequelize
  }, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'Disputes',
    timestamps: true,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['status'] },
      { fields: ['raised_by_user_id'] },
      { fields: ['resolved_by_user_id'] }
    ]
  });
  return Dispute;
};