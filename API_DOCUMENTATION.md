# Book Marketplace API Documentation

Complete REST API documentation for the Book Marketplace backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration
- Default: 7 days
- Refresh tokens are not yet implemented (coming soon)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Books Endpoints](#books-endpoints)
3. [Orders Endpoints](#orders-endpoints)
4. [GeoJSON Endpoints](#geojson-endpoints)
5. [Error Responses](#error-responses)
6. [Data Models](#data-models)

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "userType": "buyer",
  "phone": "+212612345678",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "location": {
    "name": "Casablanca",
    "coordinates": {
      "latitude": 33.5731,
      "longitude": -7.5898
    },
    "address": "Casablanca, Morocco"
  }
}
```

**Required Fields:**
- `email` (string, unique)
- `password` (string, min 6 characters)
- `userType` (string, enum: 'buyer' or 'seller')

**Optional Fields:**
- `phone` (string)
- `profile.firstName` (string)
- `profile.lastName` (string)
- `profile.bio` (string)
- `location` (object)

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "userType": "buyer",
    "phone": "+212612345678",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "location": {
      "name": "Casablanca",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Casablanca, Morocco"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error or user already exists
- `500` - Server error

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "userType": "buyer",
    "phone": "+212612345678",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "location": {
      "name": "Casablanca",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Casablanca, Morocco"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid credentials
- `404` - User not found
- `500` - Server error

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "userType": "buyer",
  "phone": "+212612345678",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Book enthusiast"
  },
  "location": {
    "name": "Casablanca",
    "coordinates": {
      "latitude": 33.5731,
      "longitude": -7.5898
    },
    "address": "Casablanca, Morocco"
  },
  "active": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `404` - User not found
- `500` - Server error

---

### Update User Profile

Update authenticated user's profile information.

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (all fields optional):**
```json
{
  "phone": "+212698765432",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Passionate book collector"
  },
  "location": {
    "name": "Rabat",
    "coordinates": {
      "latitude": 34.0209,
      "longitude": -6.8416
    },
    "address": "Rabat, Morocco"
  }
}
```

**Validation Rules:**
- `location.coordinates.latitude`: -90 to 90
- `location.coordinates.longitude`: -180 to 180

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "userType": "buyer",
    "phone": "+212698765432",
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith",
      "bio": "Passionate book collector"
    },
    "location": {
      "name": "Rabat",
      "coordinates": {
        "latitude": 34.0209,
        "longitude": -6.8416
      },
      "address": "Rabat, Morocco"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid coordinates or validation error
- `401` - No token or invalid token
- `500` - Server error

---

## Books Endpoints

### Get All Books

Retrieve all book listings with optional filters.

**Endpoint:** `GET /api/books`

**Query Parameters:**
- `search` (string) - Search by title or author
- `quality` (string) - Filter by quality: 'excellent', 'good', 'fair', 'poor'
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `available` (boolean) - Filter available books only
- `seller` (string) - Filter by seller ID

**Example Request:**
```
GET /api/books?search=Harry Potter&quality=excellent&minPrice=50&maxPrice=200
```

**Success Response (200):**
```json
{
  "books": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Harry Potter and the Philosopher's Stone",
      "author": "J.K. Rowling",
      "description": "First book in the Harry Potter series",
      "quality": "excellent",
      "quantity": 3,
      "price": 150,
      "seller": {
        "_id": "507f1f77bcf86cd799439011",
        "email": "seller@example.com",
        "profile": {
          "firstName": "Book",
          "lastName": "Seller"
        }
      },
      "location": {
        "name": "Casablanca",
        "coordinates": {
          "latitude": 33.5731,
          "longitude": -7.5898
        },
        "address": "Casablanca, Morocco"
      },
      "available": true,
      "createdAt": "2025-01-10T14:30:00.000Z",
      "updatedAt": "2025-01-10T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500` - Server error

---

### Get Single Book

Retrieve a specific book by ID.

**Endpoint:** `GET /api/books/:id`

**Parameters:**
- `id` (string, required) - Book ID

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Harry Potter and the Philosopher's Stone",
  "author": "J.K. Rowling",
  "description": "First book in the Harry Potter series",
  "quality": "excellent",
  "quantity": 3,
  "price": 150,
  "seller": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "seller@example.com",
    "profile": {
      "firstName": "Book",
      "lastName": "Seller"
    },
    "location": {
      "name": "Casablanca",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Casablanca, Morocco"
    }
  },
  "location": {
    "name": "Casablanca",
    "coordinates": {
      "latitude": 33.5731,
      "longitude": -7.5898
    },
    "address": "Casablanca, Morocco"
  },
  "available": true,
  "createdAt": "2025-01-10T14:30:00.000Z",
  "updatedAt": "2025-01-10T14:30:00.000Z"
}
```

**Error Responses:**
- `404` - Book not found
- `500` - Server error

---

### Create Book Listing

Create a new book listing (Seller only).

**Endpoint:** `POST /api/books`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "description": "A classic American novel",
  "quality": "good",
  "quantity": 2,
  "price": 80,
  "location": {
    "name": "Marrakech",
    "coordinates": {
      "latitude": 31.6295,
      "longitude": -7.9811
    },
    "address": "Marrakech, Morocco"
  }
}
```

**Required Fields:**
- `title` (string)
- `author` (string)
- `quality` (string, enum: 'excellent', 'good', 'fair', 'poor')
- `quantity` (number, min: 0)
- `price` (number, min: 0)

**Success Response (201):**
```json
{
  "message": "Book created successfully",
  "book": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "description": "A classic American novel",
    "quality": "good",
    "quantity": 2,
    "price": 80,
    "seller": "507f1f77bcf86cd799439011",
    "location": {
      "name": "Marrakech",
      "coordinates": {
        "latitude": 31.6295,
        "longitude": -7.9811
      },
      "address": "Marrakech, Morocco"
    },
    "available": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated or not a seller
- `500` - Server error

---

### Update Book

Update an existing book listing (Seller only, own books).

**Endpoint:** `PUT /api/books/:id`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body (all fields optional):**
```json
{
  "title": "The Great Gatsby (Revised Edition)",
  "price": 90,
  "quantity": 1,
  "available": false
}
```

**Success Response (200):**
```json
{
  "message": "Book updated successfully",
  "book": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "The Great Gatsby (Revised Edition)",
    "author": "F. Scott Fitzgerald",
    "price": 90,
    "quantity": 1,
    "available": false,
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not authorized (not the book owner)
- `404` - Book not found
- `500` - Server error

---

### Delete Book

Delete a book listing (Seller only, own books).

**Endpoint:** `DELETE /api/books/:id`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Success Response (200):**
```json
{
  "message": "Book deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not authorized (not the book owner)
- `404` - Book not found
- `500` - Server error

---

### Get My Books

Get all books for authenticated seller.

**Endpoint:** `GET /api/books/seller/my-books`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Success Response (200):**
```json
{
  "books": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "quality": "good",
      "quantity": 2,
      "price": 80,
      "available": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated or not a seller
- `500` - Server error

---

## Orders Endpoints

### Create Order

Create a new order (Buyer only).

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "book": "507f1f77bcf86cd799439012",
  "quantity": 1,
  "buyerLocation": {
    "name": "Rabat",
    "coordinates": {
      "latitude": 34.0209,
      "longitude": -6.8416
    },
    "address": "Avenue Mohammed V, Rabat, Morocco"
  },
  "buyerNotes": "Please deliver before 5 PM"
}
```

**Required Fields:**
- `book` (string) - Book ID
- `quantity` (number, min: 1)
- `buyerLocation` (object) - Delivery location

**Success Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "buyer": "507f1f77bcf86cd799439010",
    "seller": "507f1f77bcf86cd799439011",
    "book": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Harry Potter and the Philosopher's Stone",
      "author": "J.K. Rowling",
      "price": 150
    },
    "quantity": 1,
    "totalPrice": 150,
    "status": "pending",
    "buyerLocation": {
      "name": "Rabat",
      "coordinates": {
        "latitude": 34.0209,
        "longitude": -6.8416
      },
      "address": "Avenue Mohammed V, Rabat, Morocco"
    },
    "sellerLocation": {
      "name": "Casablanca",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Casablanca, Morocco"
    },
    "buyerNotes": "Please deliver before 5 PM",
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error or insufficient stock
- `401` - Not authenticated or not a buyer
- `404` - Book not found
- `500` - Server error

---

### Get All Orders

Get all orders for authenticated user.

**Endpoint:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "buyer": {
        "_id": "507f1f77bcf86cd799439010",
        "email": "buyer@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Buyer"
        }
      },
      "seller": {
        "_id": "507f1f77bcf86cd799439011",
        "email": "seller@example.com"
      },
      "book": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Harry Potter and the Philosopher's Stone",
        "author": "J.K. Rowling"
      },
      "quantity": 1,
      "totalPrice": 150,
      "status": "confirmed",
      "buyerLocation": {
        "name": "Rabat",
        "coordinates": {
          "latitude": 34.0209,
          "longitude": -6.8416
        },
        "address": "Avenue Mohammed V, Rabat, Morocco"
      },
      "createdAt": "2025-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### Get Buyer Orders

Get all orders for authenticated buyer.

**Endpoint:** `GET /api/orders/buyer`

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Success Response (200):**
Same structure as "Get All Orders"

---

### Get Seller Orders

Get all orders for authenticated seller.

**Endpoint:** `GET /api/orders/seller`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Success Response (200):**
Same structure as "Get All Orders"

---

### Update Order Status

Update order status (Seller only).

**Endpoint:** `PUT /api/orders/:id/status`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending` - Initial state
- `confirmed` - Seller accepted order
- `delivered` - Order completed
- `refused` - Seller rejected order

**Success Response (200):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "confirmed",
    "updatedAt": "2025-01-15T13:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid status
- `401` - Not authenticated
- `403` - Not authorized (not the seller)
- `404` - Order not found
- `500` - Server error

---

## GeoJSON Endpoints

### Get Orders as GeoJSON

Export seller's orders as GeoJSON FeatureCollection.

**Endpoint:** `GET /api/geojson/orders`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Query Parameters:**
- `status` (string, optional) - Filter by status: 'pending', 'confirmed', 'delivered', 'refused'

**Success Response (200):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-6.8416, 34.0209]
      },
      "properties": {
        "orderId": "507f1f77bcf86cd799439014",
        "buyerName": "John Buyer",
        "buyerEmail": "buyer@example.com",
        "bookTitle": "Harry Potter and the Philosopher's Stone",
        "quantity": 1,
        "totalPrice": 150,
        "status": "confirmed",
        "address": "Avenue Mohammed V, Rabat, Morocco",
        "orderDate": "2025-01-15T12:00:00.000Z"
      }
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated or not a seller
- `500` - Server error

---

### Export GeoJSON

Save GeoJSON export to database.

**Endpoint:** `POST /api/geojson/export`

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "orderIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

**Success Response (201):**
```json
{
  "message": "GeoJSON export created successfully",
  "export": {
    "_id": "507f1f77bcf86cd799439016",
    "user": "507f1f77bcf86cd799439011",
    "geojsonData": {
      "type": "FeatureCollection",
      "features": [...]
    },
    "orderIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
    "exportDate": "2025-01-15T14:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid order IDs
- `401` - Not authenticated or not a seller
- `500` - Server error

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "message": "Human-readable error message",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, invalid input)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### User Schema
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  userType: 'buyer' | 'seller',
  phone: String,
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    avatar: String
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Book Schema
```javascript
{
  title: String (required),
  author: String (required),
  description: String,
  quality: 'excellent' | 'good' | 'fair' | 'poor',
  quantity: Number (min: 0),
  price: Number (min: 0),
  seller: ObjectId (ref: User),
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  images: [String],
  available: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  buyer: ObjectId (ref: User),
  seller: ObjectId (ref: User),
  book: ObjectId (ref: Book),
  quantity: Number (min: 1),
  totalPrice: Number,
  status: 'pending' | 'confirmed' | 'delivered' | 'refused',
  buyerLocation: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  sellerLocation: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  buyerNotes: String,
  deliveryDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing with Postman

Import the provided Postman collections:
- `Book_Marketplace_API_Complete.postman_collection.json`
- `Book_Marketplace_API_Automated.postman_collection.json`

### Environment Variables (Postman)

```json
{
  "baseUrl": "http://localhost:5000/api",
  "token": "<will-be-set-after-login>",
  "userId": "<will-be-set-after-login>"
}
```

---

## Rate Limiting

Currently, there are no rate limits on API endpoints. Future versions will implement:
- 100 requests/minute for authenticated users
- 20 requests/minute for unauthenticated endpoints

---

## Versioning

Current API version: **v1**

Future versions will be accessible via:
```
/api/v2/...
```

---

**Last Updated:** January 2025
