'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReviewVote extends Model {
    static associate(models) {
      // A ReviewVote belongs to one Review
      ReviewVote.belongsTo(models.Review, {
        foreignKey: 'review_id',
        as: 'review',
        onDelete: 'CASCADE'
      });
      // A ReviewVote belongs to one User
      ReviewVote.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE' // Delete vote if user is deleted
      });
    }
  }
  ReviewVote.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    review_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Reviews', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    vote_type: {
      type: DataTypes.ENUM('helpful', 'not_helpful'), // Consistent with ERD (not helpful)
      allowNull: false,
      validate: {
        isIn: {
          args: [['helpful', 'not_helpful']],
          msg: 'Invalid vote type. Must be "helpful" or "not_helpful".'
        }
      }
    },
    // Timestamps managed by Sequelize
  }, {
    sequelize,
    modelName: 'ReviewVote',
    tableName: 'ReviewVotes',
    timestamps: true,
    indexes: [
      { fields: ['review_id'] },
      { fields: ['user_id'] },
      // Unique constraint: a user can only vote once per review
      { unique: true, fields: ['review_id', 'user_id'], name: 'review_votes_review_user_uk' }
    ]
  });
  return ReviewVote;
};