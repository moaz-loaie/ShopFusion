'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Shipping', { // Table name matches model
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      shipping_address: { type: Sequelize.TEXT, allowNull: false },
      shipping_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'processing' },
      shipped_date: { type: Sequelize.DATE, allowNull: true },
      expected_delivery: { type: Sequelize.DATE, allowNull: true },
      tracking_number: { type: Sequelize.STRING, allowNull: true },
      carrier: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('Shipping', ['order_id'], { name: 'shipping_order_id_idx', unique: true });
    await queryInterface.addIndex('Shipping', ['shipping_status'], { name: 'shipping_status_idx' });
    await queryInterface.addIndex('Shipping', ['tracking_number'], { name: 'shipping_tracking_number_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Shipping', 'shipping_tracking_number_idx');
    await queryInterface.removeIndex('Shipping', 'shipping_status_idx');
    await queryInterface.removeIndex('Shipping', 'shipping_order_id_idx');
    await queryInterface.dropTable('Shipping');
  }
};