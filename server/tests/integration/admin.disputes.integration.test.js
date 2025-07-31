const request = require('supertest');
const app = require('../../server');
const { User, Order, Dispute } = require('../../db');
const { generateToken } = require('../../utils/auth');

describe('Admin Dispute Management', () => {
  let adminToken;
  let testAdmin;
  let testDispute;

  beforeAll(async () => {
    // Create test admin user
    testAdmin = await User.create({
      email: 'admin.disputes@test.com',
      password_hash: '$2b$12$test_hash',
      full_name: 'Test Admin',
      role: 'admin'
    });

    adminToken = generateToken(testAdmin);

    // Create test dispute
    const customer = await User.create({
      email: 'customer.disputes@test.com',
      password_hash: '$2b$12$test_hash',
      full_name: 'Test Customer',
      role: 'customer'
    });

    const order = await Order.create({
      customer_id: customer.id,
      total_amount: 100,
      status: 'completed'
    });

    testDispute = await Dispute.create({
      order_id: order.id,
      raised_by_user_id: customer.id,
      dispute_reason: 'Test dispute reason',
      status: 'open',
      priority: 'high'
    });
  });

  afterAll(async () => {
    await Dispute.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('GET /api/admin/disputes', () => {
    it('retrieves all disputes with correct pagination', async () => {
      const response = await request(app)
        .get('/api/admin/disputes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.disputes)).toBe(true);
      expect(response.body.totalItems).toBeDefined();
    });

    it('filters disputes by status', async () => {
      const response = await request(app)
        .get('/api/admin/disputes?status=open')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.disputes.every(d => d.status === 'open')).toBe(true);
    });

    it('filters disputes by priority', async () => {
      const response = await request(app)
        .get('/api/admin/disputes?priority=high')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.disputes.every(d => d.priority === 'high')).toBe(true);
    });
  });

  describe('PATCH /api/admin/disputes/:id', () => {
    it('updates dispute status correctly', async () => {
      const response = await request(app)
        .patch(`/api/admin/disputes/${testDispute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          resolution_details: 'Test resolution details'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.dispute.status).toBe('resolved');
      expect(response.body.data.dispute.resolved_by_user_id).toBe(testAdmin.id);
      expect(response.body.data.dispute.resolved_at).toBeDefined();
    });

    it('requires resolution details for resolved/rejected status', async () => {
      await request(app)
        .patch(`/api/admin/disputes/${testDispute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved'
        })
        .expect(400);
    });

    it('validates dispute status', async () => {
      await request(app)
        .patch(`/api/admin/disputes/${testDispute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status'
        })
        .expect(400);
    });
  });
});
