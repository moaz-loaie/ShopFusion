'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductImages', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      url: { type: Sequelize.STRING(2048), allowNull: false },
      image_type: { type: Sequelize.ENUM('preview', 'thumbnail', 'gallery'), allowNull: false, defaultValue: 'gallery' },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ProductImages', ['product_id'], { name: 'product_images_product_id_idx' });
    await queryInterface.addIndex('ProductImages', ['product_id', 'display_order'], { name: 'product_images_product_display_order_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('ProductImages', 'product_images_product_display_order_idx');
    await queryInterface.removeIndex('ProductImages', 'product_images_product_id_idx');
    await queryInterface.dropTable('ProductImages');
  }
};