// File: server/db/migrations/20250101000005-create-review.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: true, // Allow null if user is deleted
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      review_text: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('Reviews', ['product_id'], { name: 'reviews_product_id_idx' });
    await queryInterface.addIndex('Reviews', ['user_id'], { name: 'reviews_user_id_idx' });
    // Add unique constraint for (product_id, user_id)
    await queryInterface.addConstraint('Reviews', {
        fields: ['product_id', 'user_id'],
        type: 'unique',
        name: 'reviews_product_user_uk'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Reviews', 'reviews_product_user_uk');
    await queryInterface.removeIndex('Reviews', 'reviews_user_id_idx');
    await queryInterface.removeIndex('Reviews', 'reviews_product_id_idx');
    await queryInterface.dropTable('Reviews');
  }
};