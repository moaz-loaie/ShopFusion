'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      customer_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT' // Prevent user deletion if orders exist
      },
      order_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      order_status: { type: Sequelize.ENUM('processing', 'shipped', 'delivered', 'cancelled', 'pending_payment'), allowNull: false, defaultValue: 'pending_payment' },
      total_amount: { type: Sequelize.FLOAT, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add indexes
    await queryInterface.addIndex('Orders', ['customer_id'], { name: 'orders_customer_id_idx' });
    await queryInterface.addIndex('Orders', ['order_status'], { name: 'orders_order_status_idx' });
    await queryInterface.addIndex('Orders', ['order_date'], { name: 'orders_order_date_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Orders', 'orders_order_date_idx');
    await queryInterface.removeIndex('Orders', 'orders_order_status_idx');
    await queryInterface.removeIndex('Orders', 'orders_customer_id_idx');
    await queryInterface.dropTable('Orders');
  }
};