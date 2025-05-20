'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReviewVotes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      review_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Reviews', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      vote_type: { type: Sequelize.ENUM('helpful', 'not_helpful'), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('ReviewVotes', ['review_id'], { name: 'review_votes_review_id_idx' });
    await queryInterface.addIndex('ReviewVotes', ['user_id'], { name: 'review_votes_user_id_idx' });
    // Add unique constraint for (review_id, user_id)
    await queryInterface.addConstraint('ReviewVotes', {
        fields: ['review_id', 'user_id'],
        type: 'unique',
        name: 'review_votes_review_user_uk'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('ReviewVotes', 'review_votes_review_user_uk');
    await queryInterface.removeIndex('ReviewVotes', 'review_votes_user_id_idx');
    await queryInterface.removeIndex('ReviewVotes', 'review_votes_review_id_idx');
    await queryInterface.dropTable('ReviewVotes');
  }
};