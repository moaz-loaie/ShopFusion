'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkUpdate(
      'Users',
      { is_active: true },
      {
        email: 'admin@shopfusion.com',
        role: 'admin'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkUpdate(
      'Users',
      { is_active: false },
      {
        email: 'admin@shopfusion.com',
        role: 'admin'
      }
    );
  }
};
