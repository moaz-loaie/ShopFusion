const express = require("express");
const categoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { paginationMiddleware } = require("../middleware/paginationMiddleware");
const {  categoryValidation,
  idParamValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// --- Category Routes ---

router  .route("/")
  .get(paginationMiddleware(20, 100), categoryController.getAllCategories) // Public, paginated with larger default limit
  .post(
    protect,
    restrictTo("admin"), // Only admins can create categories
    categoryValidation,
    categoryController.createCategory
  );

router
  .route("/:id")
  .get(idParamValidation("id"), categoryController.getCategoryById) // Public
  .patch(
    protect,
    restrictTo("admin"), // Only admins can update
    idParamValidation("id"),
    categoryValidation, // Reuse validation
    categoryController.updateCategory
  )
  .delete(
    protect,
    restrictTo("admin"), // Only admins can delete
    idParamValidation("id"),
    categoryController.deleteCategory
  );

module.exports = router;
