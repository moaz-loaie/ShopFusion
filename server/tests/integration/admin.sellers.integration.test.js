import request from 'supertest';
import app from '../../server';
import { User } from '../../models';
import { signToken } from '../../utils/jwt';
import { hashPassword } from '../../utils/passwordUtils';

describe('Admin Sellers API Integration', () => {
  let adminToken;
  let testSeller;

  beforeAll(async () => {
    // Create admin user
    const admin = await User.create({
      email: 'admin@test.com',
      password: await hashPassword('password123'),
      role: 'admin',
      is_active: true
    });

    adminToken = signToken(admin.id);

    // Create test seller
    testSeller = await User.create({
      email: 'seller@test.com',
      password: await hashPassword('password123'),
      role: 'seller',
      is_active: true,
      full_name: 'Test Seller'
    });
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
  });

  describe('GET /api/admin/sellers', () => {
    it('returns list of sellers with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.sellers)).toBe(true);
      expect(response.body.data.totalSellers).toBeDefined();
      expect(response.body.data.activeSellers).toBeDefined();
    });

    it('filters sellers by status', async () => {
      const response = await request(app)
        .get('/api/admin/sellers?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.sellers.every(seller => seller.is_active)).toBe(true);
    });

    it('searches sellers by name or email', async () => {
      const response = await request(app)
        .get('/api/admin/sellers?search=Test Seller')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.sellers.some(seller => 
        seller.full_name === 'Test Seller' || 
        seller.email === 'seller@test.com'
      )).toBe(true);
    });
  });

  describe('PATCH /api/admin/sellers/:id/status', () => {
    it('updates seller status', async () => {
      const response = await request(app)
        .patch(`/api/admin/sellers/${testSeller.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Verify the status was actually updated
      const updatedSeller = await User.findByPk(testSeller.id);
      expect(updatedSeller.is_active).toBe(false);
    });

    it('returns 404 for non-existent seller', async () => {
      await request(app)
        .patch('/api/admin/sellers/999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(404);
    });

    it('returns 403 for non-admin users', async () => {
      const sellerToken = signToken(testSeller.id);

      await request(app)
        .patch(`/api/admin/sellers/${testSeller.id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ isActive: false })
        .expect(403);
    });
  });
});
