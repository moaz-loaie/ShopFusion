const authController = require("../../../controllers/authController");
const { User } = require("../../../db").models; // Adjusted path assuming db/index.js exports models
const { comparePassword } = require("../../../utils/passwordUtils"); // hashPassword is handled by User model hook
const AppError = require("../../../utils/AppError");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../../../config/jwt"); // Actual config for consistency
const logger = require("../../../utils/logger");

// Mock dependencies
jest.mock("../../../db", () => ({
  models: {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn(), // For 'protect' middleware simulation if needed by 'verify'
    },
  },
}));
jest.mock("../../../utils/passwordUtils"); // comparePassword will be mocked
jest.mock("jsonwebtoken"); // Mock JWT signing
jest.mock("../../../utils/logger"); // Mock logger

describe("Auth Controller - Unit Tests", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
    mockReq = { body: {}, user: null, headers: {} }; // req.user for 'verify' if testing that path
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      // cookie: jest.fn(), // If using cookie-based auth
    };
    mockNext = jest.fn(); // Mock the 'next' middleware function
  });

  describe("register", () => {
    const validRegistrationData = {
      full_name: "New Test User",
      email: "new.register@example.com",
      password: "securePassword123",
      role: "customer", // Explicitly providing role
    };

    it("should register a new user, hash password via model hook, and return token", async () => {
      const createdUserInstance = {
        id: 5, // Example ID
        ...validRegistrationData,
        password_hash: "hashedByModelHook", // Assume hook handles this
        toJSON: function () {
          return {
            id: this.id,
            email: this.email,
            full_name: this.full_name,
            role: this.role,
          };
        },
      };
      User.create.mockResolvedValue(createdUserInstance);
      jwt.sign.mockReturnValue("fake-registration-token");

      mockReq.body = validRegistrationData;
      await authController.register(mockReq, mockRes, mockNext);

      expect(User.create).toHaveBeenCalledWith({
        full_name: validRegistrationData.full_name,
        email: validRegistrationData.email,
        password_hash: validRegistrationData.password, // Controller passes plain password to model
        role: validRegistrationData.role,
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: createdUserInstance.id },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        token: "fake-registration-token",
        data: { user: createdUserInstance.toJSON() },
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          "User registered successfully: new.register@example.com"
        )
      );
    });

    it('should default to "customer" role if an invalid role is provided', async () => {
      const createdUserInstance = {
        id: 6,
        ...validRegistrationData,
        role: "customer",
        toJSON: function () {
          return {
            id: this.id,
            email: this.email,
            full_name: this.full_name,
            role: this.role,
          };
        },
      };
      User.create.mockResolvedValue(createdUserInstance);
      jwt.sign.mockReturnValue("another-fake-token");

      mockReq.body = { ...validRegistrationData, role: "nonexistentRole" };
      await authController.register(mockReq, mockRes, mockNext);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "customer" })
      );
    });

    it("should call next with AppError if required fields (e.g., full_name) are missing", async () => {
      mockReq.body = { email: "test@example.com", password: "password123" }; // full_name is missing
      await authController.register(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const appErrorInstance = mockNext.mock.calls[0][0];
      expect(appErrorInstance.statusCode).toBe(400);
      expect(appErrorInstance.message).toContain(
        "Please provide full name, email, and password"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "Registration attempt with missing fields."
      );
    });

    it("should pass database errors (e.g., duplicate email) to next from User.create", async () => {
      const dbError = new Error("Simulated DB unique constraint violation");
      dbError.name = "SequelizeUniqueConstraintError"; // Mimic Sequelize error
      User.create.mockRejectedValue(dbError);
      mockReq.body = validRegistrationData;

      await authController.register(mockReq, mockRes, mockNext);

      expect(User.create).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(dbError); // catchAsync forwards the error
      expect(mockRes.status).not.toHaveBeenCalled(); // Error handled by global error handler
    });
  });

  describe("login", () => {
    const loginCredentials = {
      email: "login.user@example.com",
      password: "password123",
    };
    const mockUserFromDb = {
      id: 10,
      email: "login.user@example.com",
      full_name: "Login User",
      role: "customer",
      password_hash: "hashedPasswordForLoginUser",
      toJSON: function () {
        return {
          id: this.id,
          email: this.email,
          full_name: this.full_name,
          role: this.role,
        };
      },
    };

    it("should successfully log in a user with correct credentials", async () => {
      User.findOne.mockResolvedValue(mockUserFromDb);
      comparePassword.mockResolvedValue(true); // Mock that password matches
      jwt.sign.mockReturnValue("fake-login-token");

      mockReq.body = loginCredentials;
      await authController.login(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: loginCredentials.email },
        attributes: expect.arrayContaining(["password_hash"]),
      });
      expect(comparePassword).toHaveBeenCalledWith(
        loginCredentials.password,
        mockUserFromDb.password_hash
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserFromDb.id },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        token: "fake-login-token",
        data: { user: mockUserFromDb.toJSON() },
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          "User logged in successfully: login.user@example.com"
        )
      );
    });

    it("should call next with AppError if user is not found during login", async () => {
      User.findOne.mockResolvedValue(null); // Simulate user not found
      mockReq.body = loginCredentials;
      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const appErrorInstance = mockNext.mock.calls[0][0];
      expect(appErrorInstance.statusCode).toBe(401);
      expect(appErrorInstance.message).toBe("Incorrect email or password");
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed login attempt for email: login.user@example.com"
      );
    });

    it("should call next with AppError if password comparison fails", async () => {
      User.findOne.mockResolvedValue(mockUserFromDb);
      comparePassword.mockResolvedValue(false); // Simulate incorrect password
      mockReq.body = loginCredentials;
      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const appErrorInstance = mockNext.mock.calls[0][0];
      expect(appErrorInstance.statusCode).toBe(401);
      expect(appErrorInstance.message).toBe("Incorrect email or password");
    });
  });

  describe("logout", () => {
    it("should return 200 success for logout endpoint and log info", () => {
      mockReq.user = { id: 1, email: "test@example.com" }; // Simulate authenticated user from 'protect' middleware
      authController.logout(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Logged out (client should clear token)",
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Logout endpoint called by User ID: 1"
      );
    });
  });

  describe("verify (Token Verification)", () => {
    it("should return user data if req.user is populated (by protect middleware)", async () => {
      const authenticatedUser = {
        id: 15,
        email: "verified@example.com",
        full_name: "Verified User",
        role: "customer",
      };
      mockReq.user = authenticatedUser; // Simulate that 'protect' middleware has run and set req.user

      await authController.verify(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: { user: authenticatedUser },
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        "Token verified for User ID: 15"
      );
    });

    // Note: The case where req.user is NOT populated before verify() is called
    // is an indication that the 'protect' middleware (which should precede 'verify')
    // either failed or wasn't used. The 'protect' middleware itself would call next(error).
    // So, unit testing 'verify' primarily checks its behavior assuming 'protect' succeeded.
  });
});
