const request = require("supertest");
const { app } = require("../../server");
const db = require("../../db");
const { User, Product, ProductCategory, Review } = db.models;
const { hashPassword } = require("../../utils/passwordUtils");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../../config/jwt");
const logger = require("../../utils/logger");

jest.mock("../../../utils/logger", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  stream: { write: jest.fn() },
}));

describe("Product API Endpoints - Integration Tests", () => {
  let sellerUser, customerUser, adminUser;
  let sellerToken, customerToken, adminToken;
  let category1, category2;
  let product1, product2, productByOtherSeller;

  const createToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
      expiresIn: "1h",
    });

  beforeAll(async () => {
    // Clean database before running tests
    // Using try-catch to prevent errors if tables don't exist on first run or have dependent data
    try {
      await Review.destroy({ where: {}, truncate: true, cascade: true });
      await Product.destroy({ where: {}, truncate: true, cascade: true });
      await ProductCategory.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
      await User.destroy({ where: {}, truncate: true, cascade: true });
    } catch (error) {
      console.error("Error cleaning database in beforeAll:", error);
    }

    // Create Users
    sellerUser = await User.create({
      full_name: "Product Seller",
      email: `seller-prod-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "seller", // Hook will hash
    });
    customerUser = await User.create({
      full_name: "Product Customer",
      email: `customer-prod-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "customer",
    });
    adminUser = await User.create({
      full_name: "Product Admin",
      email: `admin-prod-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "admin",
    });

    // Generate Tokens (re-fetch user to ensure ID is present if not returned by create)
    const fetchedSeller = await User.findOne({ where: { id: sellerUser.id } });
    const fetchedCustomer = await User.findOne({
      where: { id: customerUser.id },
    });
    const fetchedAdmin = await User.findOne({ where: { id: adminUser.id } });

    sellerToken = createToken(fetchedSeller);
    customerToken = createToken(fetchedCustomer);
    adminToken = createToken(fetchedAdmin);

    // Create Categories
    category1 = await ProductCategory.create({
      name: "Electronics Test",
      description: "Test electronics category",
    });
    category2 = await ProductCategory.create({
      name: "Books Test",
      description: "Test books category",
    });

    // Create Products
    product1 = await Product.create({
      seller_id: sellerUser.id,
      category_id: category1.id,
      name: "Laptop Pro Test",
      description: "High-end laptop for professionals.",
      price: 1200.99,
      stock_quantity: 10,
    });
    product2 = await Product.create({
      seller_id: sellerUser.id,
      category_id: category2.id,
      name: "Sci-Fi Novel Test",
      description: "A thrilling space adventure.",
      price: 19.99,
      stock_quantity: 50,
    });
    // Product by another seller for permission tests (create another temp seller)
    const otherSeller = await User.create({
      full_name: "Other Seller",
      email: `other-seller-${Date.now()}@example.com`,
      password_hash: "password123",
      role: "seller",
    });
    productByOtherSeller = await Product.create({
      seller_id: otherSeller.id,
      category_id: category1.id,
      name: "Other Seller Laptop",
      description: "Laptop from another seller.",
      price: 999.0,
      stock_quantity: 5,
    });
  });

  afterAll(async () => {
    // Clean up all created data in reverse order of creation or use truncate
    try {
      await Review.destroy({ where: {}, truncate: true, cascade: true });
      await Product.destroy({ where: {}, truncate: true, cascade: true }); // Includes productByOtherSeller
      await ProductCategory.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
      await User.destroy({ where: {}, truncate: true, cascade: true }); // Includes sellerUser, customerUser, adminUser, otherSeller
    } catch (error) {
      console.error("Error cleaning database in afterAll:", error);
    }
    await db.sequelize.close();
  });

  describe("GET /api/v1/products", () => {
    it("should return a list of all products (paginated)", async () => {
      const response = await request(app)
        .get("/api/v1/products?limit=2")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBeLessThanOrEqual(2);
      expect(response.body.totalProducts).toBeGreaterThanOrEqual(3); // We created 3 products
      expect(response.body).toHaveProperty("totalPages");
      expect(response.body).toHaveProperty("currentPage");
    });

    it("should filter products by category ID", async () => {
      const response = await request(app)
        .get(`/api/v1/products?category=${category1.id}`)
        .expect(200);
      expect(
        response.body.data.products.every((p) => p.category_id === category1.id)
      ).toBe(true);
      expect(response.body.data.products.length).toBe(2); // Laptop Pro Test, Other Seller Laptop
    });

    it("should filter products by price range", async () => {
      const response = await request(app)
        .get(`/api/v1/products?minPrice=1000&maxPrice=1500`)
        .expect(200);
      expect(
        response.body.data.products.every(
          (p) => p.price >= 1000 && p.price <= 1500
        )
      ).toBe(true);
      expect(
        response.body.data.products.find((p) => p.name === "Laptop Pro Test")
      ).toBeDefined();
    });

    it("should sort products by name ascending", async () => {
      const response = await request(app)
        .get(`/api/v1/products?sort=name:asc`)
        .expect(200);
      const names = response.body.data.products.map((p) => p.name);
      // Expect names to be sorted
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
    it("should handle invalid pagination/filter params gracefully (e.g., return all or default)", async () => {
      const response = await request(app)
        .get(`/api/v1/products?page=abc&limit=xyz&sort=invalid`) // Invalid params
        .expect(400); // Expect validation error
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("page must be positive integer");
      // Further checks for other invalid params
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("should return a single product with details", async () => {
      const response = await request(app)
        .get(`/api/v1/products/${product1.id}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.product.id).toBe(product1.id);
      expect(response.body.data.product.name).toBe(product1.name);
      expect(response.body.data.product.Seller).toBeDefined();
      expect(response.body.data.product.Category).toBeDefined();
    });

    it("should return 404 if product not found", async () => {
      const response = await request(app)
        .get("/api/v1/products/999999") // Non-existent ID
        .expect("Content-Type", /json/)
        .expect(404);
      expect(response.body.message).toBe("Product not found");
    });

    it("should return 400 for invalid product ID format", async () => {
      const response = await request(app)
        .get("/api/v1/products/invalidID")
        .expect("Content-Type", /json/)
        .expect(400);
      expect(response.body.message).toContain("Invalid id parameter");
    });
  });

  describe("POST /api/v1/products", () => {
    const newProductData = {
      name: "Test Create Product",
      description: "A product for testing creation.",
      price: 99.99,
      stock_quantity: 20,
      category_id: null, // Will set category_id dynamically
    };

    beforeEach(() => {
      newProductData.category_id = category1.id; // Ensure category ID is set
    });

    it("should allow a seller to create a product", async () => {
      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(newProductData)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.product.name).toBe(newProductData.name);
      expect(response.body.data.product.seller_id).toBe(sellerUser.id);
      // Clean up created product
      await Product.destroy({ where: { id: response.body.data.product.id } });
    });

    it("should allow an admin to create a product (assuming admin can act as seller or override)", async () => {
      // If admin creates, seller_id should be admin's ID or handled by logic
      const adminProductData = {
        ...newProductData,
        name: "Admin Created Product",
      };
      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(adminProductData)
        .expect(201);

      expect(response.body.data.product.seller_id).toBe(adminUser.id);
      await Product.destroy({ where: { id: response.body.data.product.id } });
    });

    it("should prevent a customer from creating a product (403 Forbidden)", async () => {
      await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(newProductData)
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should require authentication to create a product (401 Unauthorized)", async () => {
      await request(app)
        .post("/api/v1/products")
        .send(newProductData)
        .expect("Content-Type", /json/)
        .expect(401);
    });

    it("should return 400 for invalid product data (e.g., missing name)", async () => {
      const invalidData = { ...newProductData, name: "" };
      await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(invalidData)
        .expect(400);
    });
    it("should return 404 if category_id does not exist", async () => {
      const dataWithInvalidCategory = { ...newProductData, category_id: 99999 };
      await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(dataWithInvalidCategory)
        .expect(404); // Assuming productController checks category existence
    });
  });

  describe("PATCH /api/v1/products/:id", () => {
    const updateData = { name: "Updated Laptop Pro Test", price: 1250.0 };

    it("should allow a seller to update their own product", async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${product1.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.price).toBe(updateData.price);
    });

    it("should allow an admin to update any product", async () => {
      const adminUpdate = { description: "Admin updated description." };
      const response = await request(app)
        .patch(`/api/v1/products/${product1.id}`) // Admin updates product1 (owned by sellerUser)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(adminUpdate)
        .expect(200);
      expect(response.body.data.product.description).toBe(
        adminUpdate.description
      );
    });

    it("should prevent a seller from updating another seller's product (403 Forbidden)", async () => {
      await request(app)
        .patch(`/api/v1/products/${productByOtherSeller.id}`) // product1 is owned by sellerUser
        .set("Authorization", `Bearer ${sellerToken}`) // sellerToken is for sellerUser
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should return 404 if product to update is not found", async () => {
      await request(app)
        .patch("/api/v1/products/999999")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(404);
    });

    it("should return 400 for invalid update data", async () => {
      const invalidUpdate = { price: -100 }; // Invalid price
      await request(app)
        .patch(`/api/v1/products/${product1.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe("DELETE /api/v1/products/:id", () => {
    let tempProductToDelete;

    beforeEach(async () => {
      // Create a temporary product for each delete test to ensure isolation
      tempProductToDelete = await Product.create({
        seller_id: sellerUser.id,
        category_id: category1.id,
        name: "Temporary Product Test",
        description: "To be deleted.",
        price: 10.0,
        stock_quantity: 1,
      });
    });

    afterEach(async () => {
      // Ensure cleanup if test fails before explicit deletion
      if (tempProductToDelete) {
        await Product.destroy({ where: { id: tempProductToDelete.id } }).catch(
          () => {}
        );
      }
    });

    it("should allow a seller to delete their own product", async () => {
      await request(app)
        .delete(`/api/v1/products/${tempProductToDelete.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .expect(204); // No Content

      const dbProduct = await Product.findByPk(tempProductToDelete.id);
      expect(dbProduct).toBeNull();
      tempProductToDelete = null; // Mark as cleaned up
    });

    it("should allow an admin to delete any product", async () => {
      await request(app)
        .delete(`/api/v1/products/${tempProductToDelete.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204);

      const dbProduct = await Product.findByPk(tempProductToDelete.id);
      expect(dbProduct).toBeNull();
      tempProductToDelete = null;
    });

    it("should prevent a seller from deleting another seller's product (403 Forbidden)", async () => {
      // productByOtherSeller is owned by a different seller
      await request(app)
        .delete(`/api/v1/products/${productByOtherSeller.id}`)
        .set("Authorization", `Bearer ${sellerToken}`) // sellerToken is for sellerUser
        .expect(403);
    });

    it("should return 404 if product to delete is not found", async () => {
      await request(app)
        .delete("/api/v1/products/999999")
        .set("Authorization", `Bearer ${sellerToken}`)
        .expect(404);
    });
  });

  // --- Nested Review Routes on Products ---
  describe("POST /api/v1/products/:productId/reviews", () => {
    const reviewData = { rating: 5, review_text: "This product is amazing!" };

    it("should allow an authenticated customer to create a review", async () => {
      const response = await request(app)
        .post(`/api/v1/products/${product1.id}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.review.product_id).toBe(product1.id);
      expect(response.body.data.review.user_id).toBe(customerUser.id);
      expect(response.body.data.review.rating).toBe(reviewData.rating);
      // Clean up review
      await Review.destroy({ where: { id: response.body.data.review.id } });
    });

    it("should prevent a seller from reviewing a product (403 Forbidden)", async () => {
      await request(app)
        .post(`/api/v1/products/${product1.id}/reviews`)
        .set("Authorization", `Bearer ${sellerToken}`) // Sellers might not be allowed to review
        .send(reviewData)
        .expect(403); // Assuming only 'customer' role can review
    });

    it("should prevent creating a review for a non-existent product (404 Not Found)", async () => {
      await request(app)
        .post("/api/v1/products/999999/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData)
        .expect(404);
    });

    it("should prevent a user from reviewing the same product twice (409 Conflict)", async () => {
      // First review
      await request(app)
        .post(`/api/v1/products/${product1.id}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData);

      // Attempt second review
      const response = await request(app)
        .post(`/api/v1/products/${product1.id}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ rating: 4, review_text: "Another review attempt." })
        .expect(409);
      expect(response.body.message).toContain("already reviewed");

      // Clean up the first review
      await Review.destroy({
        where: { product_id: product1.id, user_id: customerUser.id },
      });
    });
  });

  describe("GET /api/v1/products/:productId/reviews", () => {
    let reviewByCustomer;
    beforeAll(async () => {
      reviewByCustomer = await Review.create({
        product_id: product1.id,
        user_id: customerUser.id,
        rating: 4,
        review_text: "A good product, enjoyed it.",
      });
    });
    afterAll(async () => {
      if (reviewByCustomer) await reviewByCustomer.destroy();
    });

    it("should return reviews for a specific product", async () => {
      const response = await request(app)
        .get(`/api/v1/products/${product1.id}/reviews`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.reviews.length).toBeGreaterThanOrEqual(1);
      const foundReview = response.body.data.reviews.find(
        (r) => r.id === reviewByCustomer.id
      );
      expect(foundReview).toBeDefined();
      expect(foundReview.User).toBeDefined(); // Check if user details are included
      expect(foundReview.User.full_name).toBe(customerUser.full_name);
    });

    it("should return 404 if product for reviews does not exist", async () => {
      await request(app).get("/api/v1/products/999999/reviews").expect(404);
    });
  });
});
