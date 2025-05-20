// File: server/db/migrations/20250101000003-create-product.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      seller_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      category_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ProductCategories', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      price: { type: Sequelize.FLOAT, allowNull: false },
      stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      preview_image_url: { type: Sequelize.STRING(2048) },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add Indexes
    await queryInterface.addIndex('Products', ['seller_id'], { name: 'products_seller_id_idx' });
    await queryInterface.addIndex('Products', ['category_id'], { name: 'products_category_id_idx' });
    await queryInterface.addIndex('Products', ['name'], { name: 'products_name_idx' });
    await queryInterface.addIndex('Products', ['price'], { name: 'products_price_idx' });
  },
  async down(queryInterface, Sequelize) {
     await queryInterface.removeIndex('Products', 'products_price_idx');
     await queryInterface.removeIndex('Products', 'products_name_idx');
     await queryInterface.removeIndex('Products', 'products_category_id_idx');
     await queryInterface.removeIndex('Products', 'products_seller_id_idx');
    await queryInterface.dropTable('Products');
  }
};