'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductCategories', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      thumbnail_url: { type: Sequelize.STRING(2048) }, // Allow long URLs
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add index on name for faster lookups/uniqueness check
    await queryInterface.addIndex('ProductCategories', ['name'], { name: 'product_categories_name_idx', unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('ProductCategories', 'product_categories_name_idx');
    await queryInterface.dropTable('ProductCategories');
  }
};