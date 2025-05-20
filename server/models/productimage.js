'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductImage.init({
    product_id: DataTypes.INTEGER,
    url: DataTypes.STRING,
    image_type: DataTypes.ENUM('preview', 'thumbnail', 'gallery'),
    display_order: DataTypes.INTEGER,
    created_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ProductImage',
  });
  return ProductImage;
};