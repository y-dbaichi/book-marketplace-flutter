# Manual API Testing Guide

## Start the Server

```bash
cd backend
npm start
# Server runs on http://localhost:5001
```

## Test Authentication

### 1. Register a User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "TestPass123!",
    "userType": "seller",
    "phone": "+1234567890",
    "location": {
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "name": "My Store",
      "address": "123 Main St, Casablanca"
    },
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "TestPass123!"
  }'
```

Save the token from the response!

### 3. Get Profile
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Test Books API

### 1. Create a Book (Seller only)
```bash
curl -X POST http://localhost:5001/api/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "quality": "excellent",
    "quantity": 5,
    "price": 150,
    "description": "A must-read for every developer",
    "category": "Programming",
    "isbn": "978-0132350884"
  }'
```

### 2. Get All Books (Public)
```bash
curl -X GET "http://localhost:5001/api/books?category=Programming&minPrice=100&maxPrice=200"
```

### 3. Search Books
```bash
curl -X GET "http://localhost:5001/api/books?search=Clean+Code"
```

## Test Orders API

### 1. Create Order (Buyer only)
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer BUYER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "book": "BOOK_ID_HERE",
    "quantity": 2,
    "buyerLocation": {
      "coordinates": [-7.5898, 33.5731],
      "name": "Home",
      "address": "456 Buyer St"
    },
    "buyerNotes": "Please call before delivery"
  }'
```

### 2. Get My Orders
```bash
# As Buyer
curl -X GET http://localhost:5001/api/orders/my/buyer \
  -H "Authorization: Bearer BUYER_TOKEN"

# As Seller
curl -X GET http://localhost:5001/api/orders/my/seller \
  -H "Authorization: Bearer SELLER_TOKEN"
```

### 3. Update Order Status
```bash
curl -X PUT http://localhost:5001/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

## Test GeoJSON API

### 1. Generate Export
```bash
curl -X POST http://localhost:5001/api/geojson/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportType": "buyer_orders"
  }'
```

### 2. List My Exports
```bash
curl -X GET http://localhost:5001/api/geojson/my-exports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Download Export
```bash
curl -X GET http://localhost:5001/api/geojson/download/EXPORT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o export.geojson
```

## Using Postman

1. Import the collection: `Book_Marketplace_API_Complete.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: http://localhost:5001
   - `token`: (will be set automatically after login)
3. Run the requests in order

## Health Check
```bash
curl http://localhost:5001/api/health
```

## Common HTTP Status Codes

- **200 OK** - Success
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Not authorized for this action
- **404 Not Found** - Resource not found
- **410 Gone** - Resource expired
- **500 Server Error** - Something went wrong
