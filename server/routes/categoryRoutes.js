const express = require("express");
const categoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  categoryValidation,
  idParamValidation,
  paginationValidation, // If listing categories paginated
} = require("../middleware/validationMiddleware");

const router = express.Router();

// --- Category Routes ---

router
  .route("/")
  .get(paginationValidation, categoryController.getAllCategories) // Public, maybe paginated
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
