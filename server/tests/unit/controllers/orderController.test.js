// Unit tests for orderController
const orderController = require('../../../controllers/orderController');
const httpMocks = require('node-mocks-http');
const db = require('../../../db');

jest.mock('../../../db');

describe('orderController', () => {
  describe('getMyOrders', () => {
    it('should return 200 and orders for user', async () => {
      // Mock req/res/next
      const req = httpMocks.createRequest({ user: { id: 1 }, query: {} });
      const res = httpMocks.createResponse();
      const next = jest.fn();
      db.models.Order = { findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [] }) };
      await orderController.getMyOrders(req, res, next);
      expect(res.statusCode).toBe(200);
    });
  });
  // Add more unit tests for createOrder, getOrderById, etc.
});
