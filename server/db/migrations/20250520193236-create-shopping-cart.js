'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ShoppingCarts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      customer_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true, // One cart per customer
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
     // Index on customer_id is automatically created due to unique constraint, but explicit is fine too
     // await queryInterface.addIndex('ShoppingCarts', ['customer_id'], { name: 'shopping_carts_customer_id_idx', unique: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ShoppingCarts'); // Drops associated indexes too
  }
};