// Unit tests for categoryController
const categoryController = require('../../../controllers/categoryController');
const httpMocks = require('node-mocks-http');
const db = require('../../../db');

jest.mock('../../../db');

describe('categoryController', () => {
  describe('getAllCategories', () => {
    it('should return 200 and categories', async () => {
      const req = httpMocks.createRequest({ query: {} });
      const res = httpMocks.createResponse();
      const next = jest.fn();
      db.models.ProductCategory = { findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [] }) };
      await categoryController.getAllCategories(req, res, next);
      expect(res.statusCode).toBe(200);
    });
  });
  // Add more unit tests for createCategory, getCategoryById, etc.
});
