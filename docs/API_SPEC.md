# API Specification

## Base URL

```http
http://localhost:3000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

## Error Response Format

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Optional array of validation errors
}
```

## Endpoints

### Admin Seller Management

#### Get All Sellers

```http
GET /admin/sellers
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for filtering sellers
- `status` (optional): Filter by seller status ('active' or 'inactive')
- `productCount` (optional): Filter by number of products

Response:

```json
{
  "status": "success",
  "data": {
    "sellers": [
      {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "is_active": true,
        "product_count": 5,
        "created_at": "2025-06-08T10:00:00Z"
      }
    ],
    "totalSellers": 100,
    "activeSellers": 75,
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "limit": 10
    }
  }
}
```

#### Update Seller Status

```http
PATCH /admin/sellers/:id/status
```

Request Body:

```json
{
  "isActive": true
}
```

Response:

```json
{
  "status": "success",
  "message": "Seller status updated successfully",
  "data": {
    "seller": {
      "id": 1,
      "is_active": true,
      "updated_at": "2025-06-08T10:00:00Z"
    }
  }
}
```

### Products Management

#### Get Products (Role-based)

```http
GET /products
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 12)
- `search` (optional): Search term
- `status` (optional): Product status filter
- `category` (optional): Category ID
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `sortBy` (optional): Sort field
- `order` (optional): Sort order ('asc' or 'desc')

Response varies by role:

- Admin: All products (pending, rejected, approved)
- Seller: Approved products + own pending/rejected
- Customer/Guest: Only approved products

Response Format:

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "status": "approved",
        "seller": {
          "id": 1,
          "name": "Seller Name"
        },
        "category": {
          "id": 1,
          "name": "Category Name"
        },
        "images": [
          {
            "id": 1,
            "url": "https://example.com/image.jpg"
          }
        ],
        "created_at": "2025-06-08T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "limit": 12
    }
  }
}
