'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ModerationQueue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ModerationQueue.init({
    product_id: DataTypes.INTEGER,
    status: DataTypes.ENUM('pending', 'approved', 'rejected'),
    feedback: DataTypes.STRING,
    admin_id: DataTypes.INTEGER,
    reviewed_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ModerationQueue',
  });
  return ModerationQueue;
};