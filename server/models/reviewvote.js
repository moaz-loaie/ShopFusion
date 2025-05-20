'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReviewVote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ReviewVote.init({
    review_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    vote_type: DataTypes.ENUM('helpful', 'not_helpful'),
    created_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ReviewVote',
  });
  return ReviewVote;
};