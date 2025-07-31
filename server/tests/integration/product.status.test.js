const request = require('supertest');
const app = require('../../app');
const { Product, User, ModerationQueue } = require('../../models');
const { generateToken } = require('../../utils/authUtils');

describe('Product Status Management', () => {
  let adminToken;
  let testProduct;
  let testSeller;

  beforeAll(async () => {
    // Create test seller
    testSeller = await User.create({
      email: 'seller@test.com',
      password: 'password123',
      full_name: 'Test Seller',
      role: 'seller'
    });

    // Create test admin
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      full_name: 'Test Admin',
      role: 'admin'
    });

    adminToken = generateToken(admin);

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock_quantity: 100,
      seller_id: testSeller.id
    });

    // Initial moderation status
    await ModerationQueue.create({
      product_id: testProduct.id,
      admin_id: admin.id,
      status: 'pending'
    });
  });

  afterAll(async () => {
    await ModerationQueue.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  it('should allow admin to update product status to approved', async () => {
    const response = await request(app)
      .patch(`/api/v1/products/${testProduct.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        feedback: 'Product meets all requirements'
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.status).toBe('approved');

    // Verify product is active
    const updatedProduct = await Product.findByPk(testProduct.id);
    expect(updatedProduct.is_active).toBe(true);

    // Verify moderation queue entry
    const moderation = await ModerationQueue.findOne({
      where: { product_id: testProduct.id },
      order: [['created_at', 'DESC']]
    });
    expect(moderation.status).toBe('approved');
  });

  it('should allow admin to reject product with feedback', async () => {
    const response = await request(app)
      .patch(`/api/v1/products/${testProduct.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'rejected',
        feedback: 'Product description needs improvement'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('rejected');
    expect(response.body.data.feedback).toBe('Product description needs improvement');

    // Verify product is inactive
    const updatedProduct = await Product.findByPk(testProduct.id);
    expect(updatedProduct.is_active).toBe(false);
  });

  it('should not allow invalid status values', async () => {
    const response = await request(app)
      .patch(`/api/v1/products/${testProduct.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'invalid_status',
        feedback: 'Test feedback'
      });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent product', async () => {
    const response = await request(app)
      .patch('/api/v1/products/999999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        feedback: 'Test feedback'
      });

    expect(response.status).toBe(404);
  });

  it('should handle database errors gracefully', async () => {
    // Temporarily break the database connection
    const originalCreate = ModerationQueue.create;
    ModerationQueue.create = jest.fn().mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .patch(`/api/v1/products/${testProduct.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        feedback: 'Test feedback'
      });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('error');

    // Restore the original function
    ModerationQueue.create = originalCreate;
  });
});
