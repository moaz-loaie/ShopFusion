// Utilities for order-related operations
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.quantity * item.unit_price;
  }, 0);
};

const validateStockAvailability = async (items, transaction) => {
  for (const item of items) {
    const product = await Product.findByPk(item.product_id, {
      lock: true, // Lock the row for update
      transaction,
    });
    
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`);
    }
    
    if (product.stock_quantity < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
      );
    }
  }
};

const updateProductStock = async (items, transaction) => {
  for (const item of items) {
    await Product.decrement(
      { stock_quantity: item.quantity },
      {
        where: { id: item.product_id },
        transaction,
      }
    );
  }
};

module.exports = {
  calculateOrderTotal,
  validateStockAvailability,
  updateProductStock
};
