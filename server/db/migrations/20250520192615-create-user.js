'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      full_name: { type: Sequelize.STRING, allowNull: false },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('customer', 'seller', 'admin'), allowNull: false, defaultValue: 'customer' },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add index on email for faster login lookups
    await queryInterface.addIndex('Users', ['email'], { name: 'users_email_idx', unique: true });
    // Add index on role if frequently filtering by role
    await queryInterface.addIndex('Users', ['role'], { name: 'users_role_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_role_idx');
    await queryInterface.removeIndex('Users', 'users_email_idx');
    await queryInterface.dropTable('Users');
  }
};