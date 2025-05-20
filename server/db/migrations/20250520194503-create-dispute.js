'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Disputes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      order_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      raised_by_user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE' // Or SET NULL to keep dispute if user deleted
      },
      dispute_reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('open', 'resolved', 'rejected', 'under_review'), allowNull: false, defaultValue: 'open' },
      resolution_details: { type: Sequelize.TEXT, allowNull: true },
      resolved_by_user_id: { // User ID of admin who resolved
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('Disputes', ['order_id'], { name: 'disputes_order_id_idx' });
    await queryInterface.addIndex('Disputes', ['status'], { name: 'disputes_status_idx' });
    await queryInterface.addIndex('Disputes', ['raised_by_user_id'], { name: 'disputes_raised_by_user_id_idx' });
    await queryInterface.addIndex('Disputes', ['resolved_by_user_id'], { name: 'disputes_resolved_by_user_id_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Disputes', 'disputes_resolved_by_user_id_idx');
    await queryInterface.removeIndex('Disputes', 'disputes_raised_by_user_id_idx');
    await queryInterface.removeIndex('Disputes', 'disputes_status_idx');
    await queryInterface.removeIndex('Disputes', 'disputes_order_id_idx');
    await queryInterface.dropTable('Disputes');
  }
};