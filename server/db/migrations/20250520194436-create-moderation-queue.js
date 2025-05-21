'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ModerationQueue', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      feedback: { type: Sequelize.TEXT, allowNull: true },
      admin_id: { // User ID of admin who reviewed
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ModerationQueue', ['product_id'], { name: 'moderation_queue_product_id_idx', unique: true });
    await queryInterface.addIndex('ModerationQueue', ['status'], { name: 'moderation_queue_status_idx' });
    await queryInterface.addIndex('ModerationQueue', ['admin_id'], { name: 'moderation_queue_admin_id_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('ModerationQueue', 'moderation_queue_admin_id_idx');
    await queryInterface.removeIndex('ModerationQueue', 'moderation_queue_status_idx');
    await queryInterface.removeIndex('ModerationQueue', 'moderation_queue_product_id_idx');
    await queryInterface.dropTable('ModerationQueue');
  }
};