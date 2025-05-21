const request = require("supertest");
const { app } = require("../../server"); // Ensure server.js exports app
const db = require("../../db");
const { User } = db.models;
const { hashPassword } = require("../../utils/passwordUtils");
const jwt = require("jsonwebtoken"); // For creating a token for a user that will be deleted
const jwtConfigModule = require("../../config/jwt"); // Actual config
const logger = require("../../utils/logger");

// Mock logger for cleaner test output
jest.mock("../../../utils/logger", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  stream: { write: jest.fn() },
}));

describe("Authentication API Endpoints - Integration Tests", () => {
  const uniqueEmailSuffix = Date.now();
  const testUserData = {
    full_name: "Auth Integration Test User",
    email: `auth-integ-${uniqueEmailSuffix}@example.com`,
    password: "PasswordForIntegrationTest123!",
    role: "customer", // Explicit role
  };
  let validAuthTokenForExistingUser; // Store token for authenticated requests

  // Before all tests, ensure a clean state if necessary
  beforeAll(async () => {
    // It's crucial that the test database is separate and can be wiped.
    // await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  // Clean up specifically created users after each test to maintain isolation
  afterEach(async () => {
    await User.destroy({ where: { email: testUserData.email } });
    await User.destroy({
      where: { email: `temp-delete-user-${uniqueEmailSuffix}@example.com` },
    }); // For specific test
    validAuthTokenForExistingUser = null;
  });

  afterAll(async () => {
    await db.sequelize.close(); // Close database connection after all tests in this file
    // Note: Closing the server instance might be needed if app.listen is not handled well
    // For Supertest, typically app itself is passed, not a running server instance.
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully and return user data and a token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUserData)
        .expect("Content-Type", /json/)
        .expect(201); // HTTP 201 Created

      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.user.full_name).toBe(testUserData.full_name);
      expect(response.body.data.user.role).toBe(testUserData.role);
      expect(response.body.data.user).not.toHaveProperty("password_hash"); // Ensure password hash is not sent

      // Verify user creation in the database
      const dbUser = await User.findOne({
        where: { email: testUserData.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.email).toBe(testUserData.email);
    });

    it("should fail to register if email already exists (HTTP 409)", async () => {
      // First, create the user directly in DB
      await User.create({
        ...testUserData,
        password_hash: testUserData.password, // Model hook will hash this
      });

      // Attempt to register again with the same email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUserData)
        .expect("Content-Type", /json/)
        .expect(409); // Expecting 409 Conflict due to unique constraint

      expect(response.body.status).toBe("fail"); // Or 'error' as per global error handler
      expect(response.body.message).toMatch(
        /email address already in use|duplicate value/i
      );
    });

    it("should fail to register with invalid input data (HTTP 400)", async () => {
      const invalidData = {
        ...testUserData,
        email: "notanemail",
        password: "short",
      };
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body.status).toBe("fail");
      // Check for specific validation messages
      expect(response.body.message).toContain("email: invalid format");
      expect(response.body.message).toContain(
        "password: must be at least 8 chars"
      );
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Ensure user exists for login tests
      await User.create({
        ...testUserData,
        password_hash: testUserData.password, // Model hook will hash
      });
    });

    it("should log in an existing user with correct credentials and return a token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUserData.email, password: testUserData.password })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      validAuthTokenForExistingUser = response.body.token; // Save for use in other tests
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.user).not.toHaveProperty("password_hash");
    });

    it("should fail to log in with an incorrect password (HTTP 401)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUserData.email, password: "WrongPassword123!" })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Incorrect email or password");
    });

    it("should fail to log in with a non-existent email (HTTP 401)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@example.com", password: testUserData.password })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Incorrect email or password");
    });

    it("should fail to log in with missing credentials (HTTP 400)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUserData.email }) // Password missing
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("password: required");
    });
  });

  describe("GET /api/v1/auth/verify (Protected Route)", () => {
    beforeEach(async () => {
      // Create and log in user to get a valid token
      await User.create({
        ...testUserData,
        password_hash: testUserData.password,
      });
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUserData.email, password: testUserData.password });
      validAuthTokenForExistingUser = loginRes.body.token;
    });

    it("should verify a valid token and return user data (HTTP 200)", async () => {
      const response = await request(app)
        .get("/api/v1/auth/verify")
        .set("Authorization", `Bearer ${validAuthTokenForExistingUser}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.user).not.toHaveProperty("password_hash");
    });

    it("should fail with 401 if no token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/auth/verify")
        .expect("Content-Type", /json/)
        .expect(401);
      expect(response.body.message).toContain("not logged in");
    });

    it("should fail with 401 if an invalid/malformed token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/auth/verify")
        .set("Authorization", "Bearer an-invalid-and-malformed-token")
        .expect("Content-Type", /json/)
        .expect(401);
      expect(response.body.message).toContain("Invalid token");
    });

    it("should fail with 401 if token is valid but the user associated no longer exists", async () => {
      // Create a temporary user, generate a token, then delete the user
      const tempUser = await User.create({
        full_name: "Temporary Delete User",
        email: `temp-delete-user-${uniqueEmailSuffix}@example.com`,
        password_hash: "tempPassword123!", // Will be hashed by hook
      });
      const tokenForDeletedUser = jwt.sign(
        { id: tempUser.id },
        jwtConfigModule.secret,
        { expiresIn: "5m" }
      );
      await tempUser.destroy(); // Delete the user from DB

      const response = await request(app)
        .get("/api/v1/auth/verify")
        .set("Authorization", `Bearer ${tokenForDeletedUser}`)
        .expect("Content-Type", /json/)
        .expect(401);
      expect(response.body.message).toContain(
        "user belonging to this token no longer exists"
      );
    });
  });

  describe("GET /api/v1/auth/logout", () => {
    it("should return a success message for logout (HTTP 200)", async () => {
      // Logout is stateless, so token presence doesn't strictly matter for this endpoint usually
      const response = await request(app)
        .get("/api/v1/auth/logout")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe(
        "Logged out (client should clear token)"
      );
    });
  });
});
