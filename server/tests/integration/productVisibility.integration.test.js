const request = require("supertest");
const { app } = require("../../server");
const db = require("../../db");
const { User, Product, ModerationQueue } = db.models;
const jwt = require("jsonwebtoken");
const jwtConfig = require("../../config/jwt");

describe("Product Visibility API Endpoints - Integration Tests", () => {
  let adminUser, sellerUser1, sellerUser2, customerUser;
  let adminToken, seller1Token, seller2Token, customerToken;
  let productsData = {};

  const createToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
      expiresIn: "1h",
    });

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      full_name: "Visibility Test Admin",
      email: `admin-vis-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "admin"
    });

    sellerUser1 = await User.create({
      full_name: "Visibility Test Seller 1",
      email: `seller1-vis-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "seller"
    });

    sellerUser2 = await User.create({
      full_name: "Visibility Test Seller 2",
      email: `seller2-vis-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "seller"
    });

    customerUser = await User.create({
      full_name: "Visibility Test Customer",
      email: `customer-vis-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "customer"
    });

    // Generate tokens
    adminToken = createToken(adminUser);
    seller1Token = createToken(sellerUser1);
    seller2Token = createToken(sellerUser2);
    customerToken = createToken(customerUser);

    // Create test products with different statuses
    const seller1Products = await Promise.all([
      Product.create({
        seller_id: sellerUser1.id,
        name: "S1 Pending Product",
        description: "Product from seller 1 (pending)",
        price: 99.99,
        stock_quantity: 10
      }),
      Product.create({
        seller_id: sellerUser1.id,
        name: "S1 Approved Product",
        description: "Product from seller 1 (approved)",
        price: 149.99,
        stock_quantity: 5
      }),
      Product.create({
        seller_id: sellerUser1.id,
        name: "S1 Rejected Product",
        description: "Product from seller 1 (rejected)",
        price: 199.99,
        stock_quantity: 15
      })
    ]);

    const seller2Products = await Promise.all([
      Product.create({
        seller_id: sellerUser2.id,
        name: "S2 Pending Product",
        description: "Product from seller 2 (pending)",
        price: 89.99,
        stock_quantity: 8
      }),
      Product.create({
        seller_id: sellerUser2.id,
        name: "S2 Approved Product",
        description: "Product from seller 2 (approved)",
        price: 139.99,
        stock_quantity: 3
      })
    ]);

    // Store products for tests
    productsData = {
      seller1: {
        pending: seller1Products[0],
        approved: seller1Products[1],
        rejected: seller1Products[2]
      },
      seller2: {
        pending: seller2Products[0],
        approved: seller2Products[1]
      }
    };

    // Set up moderation queue statuses
    await Promise.all([
      ModerationQueue.create({
        product_id: seller1Products[0].id,
        status: "pending"
      }),
      ModerationQueue.create({
        product_id: seller1Products[1].id,
        status: "approved"
      }),
      ModerationQueue.create({
        product_id: seller1Products[2].id,
        status: "rejected"
      }),
      ModerationQueue.create({
        product_id: seller2Products[0].id,
        status: "pending"
      }),
      ModerationQueue.create({
        product_id: seller2Products[1].id,
        status: "approved"
      })
    ]);
  });

  afterAll(async () => {
    // Clean up all test data
    await ModerationQueue.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
    await db.sequelize.close();
  });

  describe("GET /api/v1/products (Admin View)", () => {
    it("should show all products to admin regardless of status", async () => {
      const response = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      const totalProducts = products.length;
      
      // Should see all 5 products
      expect(totalProducts).toBe(5);
      
      // Verify we can see products in each status
      expect(products.some(p => p.id === productsData.seller1.pending.id)).toBe(true);
      expect(products.some(p => p.id === productsData.seller1.approved.id)).toBe(true);
      expect(products.some(p => p.id === productsData.seller1.rejected.id)).toBe(true);
    });

    it("should allow admin to filter by status", async () => {
      const pendingResponse = await request(app)
        .get("/api/v1/products?status=pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(pendingResponse.status).toBe(200);
      const pendingProducts = pendingResponse.body.data.products;
      expect(pendingProducts.length).toBe(2); // Two pending products
      expect(pendingProducts.every(p => p.ModerationQueue.status === "pending")).toBe(true);
    });
  });

  describe("GET /api/v1/products (Seller View)", () => {
    it("should show seller their own products plus approved products from others", async () => {
      const response = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${seller1Token}`);

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      
      // Should see all their own products (3) plus approved products from other seller (1)
      expect(products.length).toBe(4);
      
      // Should see all their own products
      expect(products.some(p => p.id === productsData.seller1.pending.id)).toBe(true);
      expect(products.some(p => p.id === productsData.seller1.approved.id)).toBe(true);
      expect(products.some(p => p.id === productsData.seller1.rejected.id)).toBe(true);
      
      // Should only see approved products from other seller
      expect(products.some(p => p.id === productsData.seller2.approved.id)).toBe(true);
      expect(products.every(p => p.seller_id !== sellerUser2.id || p.ModerationQueue.status === "approved")).toBe(true);
    });

    it("should allow seller to filter by status for their own products", async () => {
      const rejectedResponse = await request(app)
        .get("/api/v1/products?status=rejected")
        .set("Authorization", `Bearer ${seller1Token}`);

      expect(rejectedResponse.status).toBe(200);
      const rejectedProducts = rejectedResponse.body.data.products;
      expect(rejectedProducts.length).toBe(1);
      expect(rejectedProducts[0].id).toBe(productsData.seller1.rejected.id);
    });
  });

  describe("GET /api/v1/products (Customer/Guest View)", () => {
    it("should show only approved products to customers", async () => {
      const response = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      
      // Should only see approved products (2 total)
      expect(products.length).toBe(2);
      expect(products.every(p => p.ModerationQueue.status === "approved")).toBe(true);
      expect(products.some(p => p.id === productsData.seller1.approved.id)).toBe(true);
      expect(products.some(p => p.id === productsData.seller2.approved.id)).toBe(true);
    });

    it("should show only approved products to guests (no auth token)", async () => {
      const response = await request(app)
        .get("/api/v1/products");

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      
      // Should only see approved products (2 total)
      expect(products.length).toBe(2);
      expect(products.every(p => p.ModerationQueue.status === "approved")).toBe(true);
    });

    it("should not allow customers to filter by status", async () => {
      const response = await request(app)
        .get("/api/v1/products?status=pending")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      const products = response.body.data.products;
      
      // Should still only see approved products, ignoring status filter
      expect(products.length).toBe(2);
      expect(products.every(p => p.ModerationQueue.status === "approved")).toBe(true);
    });
  });

  // Add test cases after the setup code
  describe('GET /api/products', () => {
    it('returns only approved products for unauthenticated users', async () => {
      const response = await request(app)
        .get('/api/products');
      
      expect(response.status).toBe(200);
      const products = response.body.data.products;
      expect(products.every(p => p.status === 'approved')).toBe(true);
    });

    it('returns all products for admin users', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      const products = response.body.data.products;
      expect(products.length).toBeGreaterThan(0);
      // Should include products with all statuses
      expect(products.some(p => p.status === 'pending')).toBe(true);
      expect(products.some(p => p.status === 'approved')).toBe(true);
      expect(products.some(p => p.status === 'rejected')).toBe(true);
    });

    it('returns approved products and own products for sellers', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${seller1Token}`);
      
      expect(response.status).toBe(200);
      const products = response.body.data.products;
      products.forEach(product => {
        expect(
          product.status === 'approved' || 
          product.seller_id === sellerUser1.id
        ).toBe(true);
      });
    });

    describe('Status filtering', () => {
      it('allows admin to filter by any status', async () => {
        const statuses = ['pending', 'approved', 'rejected'];
        
        for (const status of statuses) {
          const response = await request(app)
            .get(`/api/products?status=${status}`)
            .set('Authorization', `Bearer ${adminToken}`);
          
          expect(response.status).toBe(200);
          const products = response.body.data.products;
          expect(products.every(p => p.status === status)).toBe(true);
        }
      });

      it('restricts seller status filtering appropriately', async () => {
        // Seller can see their own pending/rejected products
        const response = await request(app)
          .get('/api/products?status=pending')
          .set('Authorization', `Bearer ${seller1Token}`);
        
        expect(response.status).toBe(200);
        const products = response.body.data.products;
        products.forEach(product => {
          expect(product.seller_id).toBe(sellerUser1.id);
        });
      });

      it('restricts customer status filtering to approved only', async () => {
        const response = await request(app)
          .get('/api/products?status=pending')
          .set('Authorization', `Bearer ${customerToken}`);
        
        expect(response.status).toBe(200);
        const products = response.body.data.products;
        expect(products.every(p => p.status === 'approved')).toBe(true);
      });
    });

    describe('Seller-specific filtering', () => {
      it('allows sellers to filter by their own products', async () => {
        const response = await request(app)
          .get('/api/products?seller=me')
          .set('Authorization', `Bearer ${seller1Token}`);
        
        expect(response.status).toBe(200);
        const products = response.body.data.products;
        expect(products.every(p => p.seller_id === sellerUser1.id)).toBe(true);
      });

      it('allows sellers to see approved products from other sellers', async () => {
        const response = await request(app)
          .get('/api/products?excludeOwn=true')
          .set('Authorization', `Bearer ${seller1Token}`);
        
        expect(response.status).toBe(200);
        const products = response.body.data.products;
        expect(products.every(p => 
          p.status === 'approved' && p.seller_id !== sellerUser1.id
        )).toBe(true);
      });
    });
  });
});
