export const PRODUCT_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MINE: 'mine',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
};

export const STATUS_LABELS = {
  [PRODUCT_STATUS.ALL]: 'All Products',
  [PRODUCT_STATUS.PENDING]: 'Pending Review',
  [PRODUCT_STATUS.APPROVED]: 'Approved Products',
  [PRODUCT_STATUS.REJECTED]: 'Rejected Products',
  [PRODUCT_STATUS.MINE]: 'My Products',
};

export const SELLER_STATUS_LABELS = {
  [PRODUCT_STATUS.ALL]: 'All Products (Mine + Others\' Approved)',
  [PRODUCT_STATUS.MINE]: 'My Products Only',
  [PRODUCT_STATUS.APPROVED]: 'Other Sellers\' Approved Products',
  [PRODUCT_STATUS.PENDING]: 'My Pending Products',
  [PRODUCT_STATUS.REJECTED]: 'My Rejected Products',
};

export const ITEMS_PER_PAGE = 12;
