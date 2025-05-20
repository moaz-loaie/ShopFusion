'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Dispute.init({
    order_id: DataTypes.INTEGER,
    dispute_reason: DataTypes.STRING,
    status: DataTypes.ENUM('open', 'resolved', 'rejected'),
    created_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Dispute',
  });
  return Dispute;
};