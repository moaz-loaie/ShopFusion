'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CartItems', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      cart_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ShoppingCarts', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE' // Item removed if product deleted
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.FLOAT, allowNull: false }, // Price at time of adding
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add unique constraint for cart_id and product_id
    await queryInterface.addConstraint('CartItems', {
        fields: ['cart_id', 'product_id'],
        type: 'unique',
        name: 'cart_items_cart_product_uk'
    });
     // Add indexes for foreign keys for faster lookups
     await queryInterface.addIndex('CartItems', ['cart_id'], { name: 'cart_items_cart_id_idx' });
     await queryInterface.addIndex('CartItems', ['product_id'], { name: 'cart_items_product_id_idx' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CartItems', 'cart_items_cart_product_uk');
    await queryInterface.removeIndex('CartItems', 'cart_items_product_id_idx');
    await queryInterface.removeIndex('CartItems', 'cart_items_cart_id_idx');
    await queryInterface.dropTable('CartItems');
  }
};