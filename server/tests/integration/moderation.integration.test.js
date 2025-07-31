const request = require('supertest');
const app = require('../../app');
const { User, Product, ModerationQueue, sequelize } = require('../../db');

describe('Product Moderation Tests', () => {
  let adminUser, sellerUser1, sellerUser2, adminToken;
  let product1, product2;

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      full_name: 'Test Admin',
      email: 'testadmin@example.com',
      password_hash: 'password123',
      role: 'admin'
    });

    sellerUser1 = await User.create({
      full_name: 'Test Seller 1',
      email: 'testseller1@example.com',
      password_hash: 'password123',
      role: 'seller'
    });

    sellerUser2 = await User.create({
      full_name: 'Test Seller 2',
      email: 'testseller2@example.com',
      password_hash: 'password123',
      role: 'seller'
    });

    // Create test products
    product1 = await Product.create({
      seller_id: sellerUser1.id,
      name: 'Test Product 1',
      description: 'Product from seller 1',
      price: 99.99,
      stock_quantity: 10
    });

    product2 = await Product.create({
      seller_id: sellerUser2.id,
      name: 'Test Product 2',
      description: 'Product from seller 2',
      price: 149.99,
      stock_quantity: 5
    });

    // Add products to moderation queue
    await ModerationQueue.create({
      product_id: product1.id,
      status: 'pending'
    });

    await ModerationQueue.create({
      product_id: product2.id,
      status: 'pending'
    });

    // Get admin token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testadmin@example.com',
        password: 'password123'
      });
    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up
    await ModerationQueue.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('GET /api/v1/admin/products/moderation', () => {
    it('should filter products by seller_id', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/products/moderation?seller_id=${sellerUser1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.moderationItems).toHaveLength(1);
      expect(response.body.data.moderationItems[0].product.seller_id).toBe(sellerUser1.id);
    });

    it('should filter products by both seller_id and status', async () => {
      // Update one product to approved status
      await ModerationQueue.update(
        { status: 'approved' },
        { where: { product_id: product1.id } }
      );

      const response = await request(app)
        .get(`/api/v1/admin/products/moderation?seller_id=${sellerUser1.id}&status=approved`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.moderationItems).toHaveLength(1);
      expect(response.body.data.moderationItems[0].product.seller_id).toBe(sellerUser1.id);
      expect(response.body.data.moderationItems[0].status).toBe('approved');
    });
  });
});
