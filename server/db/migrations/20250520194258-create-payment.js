'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      payment_method: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.FLOAT, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' }, // e.g., 'pending', 'succeeded', 'failed'
      payment_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      transaction_id: { type: Sequelize.STRING, unique: true, allowNull: true }, // Optional external transaction ID
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('Payments', ['order_id'], { name: 'payments_order_id_idx', unique: true });
    await queryInterface.addIndex('Payments', ['status'], { name: 'payments_status_idx' });
    await queryInterface.addIndex('Payments', ['transaction_id'], { name: 'payments_transaction_id_idx', unique: true, where: { transaction_id: { [Sequelize.Op.ne]: null } }});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Payments', 'payments_transaction_id_idx');
    await queryInterface.removeIndex('Payments', 'payments_status_idx');
    await queryInterface.removeIndex('Payments', 'payments_order_id_idx');
    await queryInterface.dropTable('Payments');
  }
};