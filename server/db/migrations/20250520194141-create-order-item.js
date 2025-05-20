'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItems', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE' // Delete items if order deleted
      },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false, // Or true if product can be deleted
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT' // Prevent product deletion if in an order item
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.FLOAT, allowNull: false }, // Price at time of order
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add indexes
    await queryInterface.addIndex('OrderItems', ['order_id'], { name: 'order_items_order_id_idx' });
    await queryInterface.addIndex('OrderItems', ['product_id'], { name: 'order_items_product_id_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('OrderItems', 'order_items_product_id_idx');
    await queryInterface.removeIndex('OrderItems', 'order_items_order_id_idx');
    await queryInterface.dropTable('OrderItems');
  }
};