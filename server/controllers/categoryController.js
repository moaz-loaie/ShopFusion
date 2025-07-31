// Controller for category-related operations
// Follows project conventions and uses async/await, error handling, and logging

const { ProductCategory } = require("../db");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

// Get all categories (optionally paginated)
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const { count, rows: categories } = await ProductCategory.findAndCountAll({
    offset: parseInt(offset),
    limit: parseInt(limit),
    order: [["name", "ASC"]],
  });
  res.status(200).json({
    status: "success",
    results: categories.length,
    total: count,
    categories,
  });
});

// Create a new category (admin only)
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const category = await ProductCategory.create({ name, description });
  logger.info(`Category created: ${name}`);
  res.status(201).json({ status: "success", category });
});

// Get a category by ID
exports.getCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const category = await ProductCategory.findByPk(id);
  if (!category) {
    return next(new AppError("Category not found.", 404));
  }
  res.status(200).json({ status: "success", category });
});

// Update a category (admin only)
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const category = await ProductCategory.findByPk(id);
  if (!category) {
    return next(new AppError("Category not found.", 404));
  }
  category.name = name || category.name;
  category.description = description || category.description;
  await category.save();
  logger.info(`Category updated: ${id}`);
  res.status(200).json({ status: "success", category });
});

// Delete a category (admin only)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const category = await ProductCategory.findByPk(id);
  if (!category) {
    return next(new AppError("Category not found.", 404));
  }
  await category.destroy();
  logger.info(`Category deleted: ${id}`);
  res.status(204).json({ status: "success", data: null });
});
