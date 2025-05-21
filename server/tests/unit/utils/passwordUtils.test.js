const bcrypt = require("bcryptjs");
const {
  hashPassword,
  comparePassword,
} = require("../../../utils/passwordUtils");
const logger = require("../../../utils/logger");

// Mock the logger to prevent console output during tests and to spy on it
jest.mock("../../../utils/logger", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe("Password Utilities - Unit Tests", () => {
  const plainPassword = "mySecurePassword123!";
  let hashedPasswordByUtil;

  beforeAll(async () => {
    // Hash the password once using the utility for comparison tests
    // This also implicitly tests if hashPassword works at a basic level.
    hashedPasswordByUtil = await hashPassword(plainPassword);
  });

  beforeEach(() => {
    // Clear mock calls before each test to ensure test isolation
    logger.error.mockClear();
  });

  describe("hashPassword", () => {
    it("should successfully hash a given password into a string of 60 characters", async () => {
      const testPassword = "anotherSecurePassword";
      const hashed = await hashPassword(testPassword);
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed.length).toBe(60); // Standard bcrypt hash length
      expect(hashed).not.toBe(testPassword); // Hash should not be the plain password
      // More specific regex for bcrypt hash format
      expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    });

    it("should produce different hashes for the same password on subsequent calls due to salting", async () => {
      const hashed1 = await hashPassword(plainPassword);
      const hashed2 = await hashPassword(plainPassword);
      expect(hashed1).not.toBe(hashed2); // Different salts should produce different hashes
    });

    it("should throw an error and log if the provided password is empty or null", async () => {
      await expect(hashPassword("")).rejects.toThrow(
        "Password cannot be empty."
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Attempted to hash an empty password."
      );

      logger.error.mockClear(); // Clear for next assertion

      await expect(hashPassword(null)).rejects.toThrow(
        "Password cannot be empty."
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Attempted to hash an empty password."
      );
    });

    it("should throw a generic error and log if the underlying bcrypt.hash fails", async () => {
      // Temporarily mock bcrypt.hash to simulate an internal failure
      const originalBcryptHash = bcrypt.hash;
      bcrypt.hash = jest
        .fn()
        .mockRejectedValueOnce(new Error("bcrypt internal hashing error"));

      await expect(hashPassword("anyValidPassword")).rejects.toThrow(
        "Password hashing failed."
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Error hashing password:",
        expect.any(Error)
      );

      bcrypt.hash = originalBcryptHash; // Restore original bcrypt.hash
    });
  });

  describe("comparePassword", () => {
    it("should return true for a correct plain password and its corresponding hash", async () => {
      const isMatch = await comparePassword(
        plainPassword,
        hashedPasswordByUtil
      );
      expect(isMatch).toBe(true);
    });

    it("should return false for an incorrect plain password against a valid hash", async () => {
      const isMatch = await comparePassword(
        "wrongPassword123!",
        hashedPasswordByUtil
      );
      expect(isMatch).toBe(false);
    });

    it("should return false if the candidatePassword is empty or null", async () => {
      expect(await comparePassword("", hashedPasswordByUtil)).toBe(false);
      expect(await comparePassword(null, hashedPasswordByUtil)).toBe(false);
    });

    it("should return false if the hashedPassword is empty or null", async () => {
      expect(await comparePassword(plainPassword, "")).toBe(false);
      expect(await comparePassword(plainPassword, null)).toBe(false);
    });

    it("should return false when comparing against an invalidly formatted hash string", async () => {
      // bcrypt.compare itself handles malformed hashes gracefully by returning false
      const isMatch = await comparePassword(
        plainPassword,
        "thisIsNotAValidBcryptHash"
      );
      expect(isMatch).toBe(false);
    });

    it("should log an error and return false if the underlying bcrypt.compare fails", async () => {
      // Temporarily mock bcrypt.compare to simulate an internal failure
      const originalBcryptCompare = bcrypt.compare;
      bcrypt.compare = jest
        .fn()
        .mockRejectedValueOnce(new Error("bcrypt internal comparison error"));

      const isMatch = await comparePassword(
        plainPassword,
        hashedPasswordByUtil
      );
      expect(isMatch).toBe(false); // Should return false on error for security
      expect(logger.error).toHaveBeenCalledWith(
        "Error comparing password:",
        expect.any(Error)
      );

      bcrypt.compare = originalBcryptCompare; // Restore original
    });
  });
});
