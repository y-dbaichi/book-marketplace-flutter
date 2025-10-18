# Backend API Documentation

## Overview

RESTful API backend for the Book Marketplace platform, built with Node.js, Express, and MongoDB.

**Technology Stack:**
- Runtime: Node.js 18+
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Authentication: JWT (JSON Web Tokens)
- File Upload: Multer
- Security: bcryptjs, CORS, helmet

## Architecture

```
backend/
├── server.js           # Entry point & Express app configuration
├── api/
│   ├── models/         # MongoDB/Mongoose models
│   │   ├── User.js     # User model (buyers & sellers)
│   │   ├── Book.js     # Book listing model
│   │   └── Order.js    # Order model with GeoJSON
│   ├── routes/         # API route handlers
│   │   ├── auth.js     # Authentication endpoints
│   │   ├── books.js    # Book CRUD endpoints
│   │   ├── orders.js   # Order management endpoints
│   │   └── geojson.js  # GeoJSON export endpoints
│   └── middleware/
│       └── auth.js     # JWT verification middleware
└── .env               # Environment configuration
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "userType": "buyer", // or "seller"
  "phone": "+212612345678" // optional
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "userType": "buyer",
    "profile": {
      "firstName": "",
      "lastName": ""
    }
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* user object */ }
}
```

**Token Validity:** 7 days

**Error Responses:**
- 400: Invalid credentials
- 404: User not found
- 500: Server error

#### GET /api/auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "userType": "buyer",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Book enthusiast"
    },
    "location": {
      "type": "Point",
      "coordinates": [-7.5898, 33.5731],
      "address": "Casablanca, Morocco"
    }
  }
}
```

#### PUT /api/auth/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Avid reader and collector"
  },
  "location": {
    "coordinates": [-7.5898, 33.5731],
    "address": "123 Main St, Casablanca"
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

### Books (`/api/books`)

#### GET /api/books
Get all book listings with optional filters.

**Query Parameters:**
- `search` - Search in title, author, ISBN
- `category` - Filter by category
- `seller` - Filter by seller ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:**
```
GET /api/books?search=Harry+Potter&category=Fiction&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "books": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Harry Potter and the Sorcerer's Stone",
      "author": "J.K. Rowling",
      "isbn": "9780439708180",
      "price": 150.00,
      "description": "The first book in the Harry Potter series",
      "category": "Fiction",
      "quantity": 5,
      "coverUrl": "https://...",
      "seller": {
        "_id": "...",
        "profile": { "firstName": "John", "lastName": "Doe" }
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

#### GET /api/books/:id
Get single book by ID.

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Harry Potter and the Sorcerer's Stone",
  "author": "J.K. Rowling",
  "isbn": "9780439708180",
  "price": 150.00,
  "description": "...",
  "quantity": 5,
  "seller": {
    "_id": "...",
    "email": "seller@example.com",
    "profile": { "firstName": "John", "lastName": "Doe" },
    "location": { "address": "Casablanca, Morocco" }
  }
}
```

#### POST /api/books
Create new book listing (sellers only).

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "price": 120.00,
  "description": "A classic American novel",
  "category": "Fiction",
  "quantity": 10,
  "coverUrl": "https://..."
}
```

**Response (201 Created):**
```json
{
  "message": "Book created successfully",
  "book": { /* created book object */ }
}
```

**Error Responses:**
- 400: Validation error
- 401: Not authenticated
- 403: User is not a seller
- 500: Server error

#### PUT /api/books/:id
Update book listing (seller must own the book).

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:** (partial update supported)
```json
{
  "price": 100.00,
  "quantity": 15
}
```

**Response (200 OK):**
```json
{
  "message": "Book updated successfully",
  "book": { /* updated book object */ }
}
```

#### DELETE /api/books/:id
Delete book listing (seller must own the book).

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200 OK):**
```json
{
  "message": "Book deleted successfully"
}
```

#### GET /api/books/my/listings
Get current seller's book listings.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200 OK):**
```json
{
  "books": [ /* array of seller's books */ ]
}
```

---

### Orders (`/api/orders`)

#### POST /api/orders
Create new order (buyers only).

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "bookId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "buyerLocation": {
    "coordinates": [-7.5898, 33.5731], // [longitude, latitude]
    "address": "123 Main St, Casablanca"
  },
  "notes": "Please call before delivery"
}
```

**Response (201 Created):**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "...",
    "book": { /* book details */ },
    "buyer": { /* buyer details */ },
    "quantity": 2,
    "totalPrice": 300.00,
    "status": "pending",
    "buyerLocation": {
      "type": "Point",
      "coordinates": [-7.5898, 33.5731],
      "address": "123 Main St, Casablanca"
    },
    "buyerNotes": "Please call before delivery",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Order Status Flow:**
```
pending → confirmed → delivered
        ↘ refused
```

#### GET /api/orders/my/buyer
Get buyer's orders.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Response (200 OK):**
```json
{
  "orders": [ /* array of buyer's orders */ ]
}
```

#### GET /api/orders/my/seller
Get seller's orders.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, delivered, refused)

**Example:**
```
GET /api/orders/my/seller?status=pending
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "_id": "...",
      "book": {
        "title": "Harry Potter",
        "price": 150.00
      },
      "buyer": {
        "email": "buyer@example.com",
        "profile": { "firstName": "Jane" },
        "phone": "+212612345678"
      },
      "quantity": 2,
      "totalPrice": 300.00,
      "status": "pending",
      "buyerLocation": {
        "type": "Point",
        "coordinates": [-7.5898, 33.5731],
        "address": "123 Main St, Casablanca"
      },
      "buyerNotes": "...",
      "sellerNotes": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### PUT /api/orders/:id/status
Update order status (sellers only).

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "status": "confirmed", // confirmed, delivered, or refused
  "notes": "Will deliver tomorrow"
}
```

**Response (200 OK):**
```json
{
  "message": "Order status updated",
  "order": { /* updated order object */ }
}
```

**Status Transitions:**
- From `pending`: → `confirmed` or `refused`
- From `confirmed`: → `delivered` or `refused`
- `delivered` and `refused` are final states

---

### GeoJSON Export (`/api/geojson`)

#### POST /api/geojson/generate
Generate GeoJSON export from order data.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Delivery Points - December 2024",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-7.5898, 33.5731]
        },
        "properties": {
          "title": "Book Title",
          "buyer": "John Doe",
          "quantity": 2
        }
      }
    ]
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Export generated successfully",
  "export": {
    "_id": "...",
    "name": "Delivery Points - December 2024",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### GET /api/geojson/my-exports
Get user's GeoJSON exports.

**Response (200 OK):**
```json
{
  "exports": [
    {
      "_id": "...",
      "name": "Delivery Points - December 2024",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### GET /api/geojson/preview/:id
Preview export data.

**Response (200 OK):**
```json
{
  "type": "FeatureCollection",
  "features": [ /* GeoJSON features */ ]
}
```

#### GET /api/geojson/download/:id
Download export as .geojson file.

**Response:** GeoJSON file download

#### DELETE /api/geojson/:id
Delete export.

**Response (200 OK):**
```json
{
  "message": "Export deleted successfully"
}
```

---

## Data Models

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  userType: String (enum: ['buyer', 'seller'], required),
  phone: String (optional),
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    avatar: String (URL)
  },
  location: {
    type: 'Point',
    coordinates: [Number, Number], // [longitude, latitude]
    address: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Book Model
```javascript
{
  title: String (required),
  author: String (required),
  isbn: String (unique, required),
  price: Number (required),
  description: String,
  category: String,
  quantity: Number (default: 1),
  coverUrl: String,
  seller: ObjectId (ref: 'User', required),
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  book: ObjectId (ref: 'Book', required),
  buyer: ObjectId (ref: 'User', required),
  quantity: Number (required),
  totalPrice: Number (required),
  status: String (enum: ['pending', 'confirmed', 'delivered', 'refused']),
  buyerLocation: {
    type: 'Point',
    coordinates: [Number, Number],
    address: String
  },
  buyerNotes: String,
  sellerNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookmarket?retryWrites=true&w=majority

# JWT Secret (use strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Flow

1. **Register/Login:**
   - User registers or logs in
   - Server returns JWT token (valid for 7 days)
   - Client stores token in localStorage

2. **Authenticated Requests:**
   - Client includes token in Authorization header
   - Server verifies token using middleware
   - If valid, request proceeds
   - If invalid/expired, returns 401 error

3. **Token Refresh:**
   - Frontend automatically redirects to login on 401 errors
   - User must re-authenticate to get new token

---

## Deployment

The backend is deployed on **Vercel** as a serverless function.

**Live API URL:** `https://book-marketplace-backend.vercel.app/api`

**Deployment Configuration:** See `vercel.json` in backend directory

**Key Features:**
- Serverless architecture
- Auto-scaling
- Global CDN
- HTTPS by default

---

## Testing

Use tools like Postman, Insomnia, or curl to test the API.

**Example curl request:**
```bash
# Register a new user
curl -X POST https://book-marketplace-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "userType": "buyer"
  }'

# Login
curl -X POST https://book-marketplace-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get books (no auth required)
curl https://book-marketplace-backend.vercel.app/api/books

# Get profile (requires auth)
curl https://book-marketplace-backend.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Security Best Practices

✅ **Implemented:**
- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation
- MongoDB injection prevention (Mongoose sanitization)
- Environment variable configuration

⚠️ **Recommendations:**
- Use HTTPS in production (Vercel provides this by default)
- Rotate JWT_SECRET regularly
- Implement rate limiting for API endpoints
- Add request logging for monitoring
- Set up MongoDB backup strategy

---

## Support

For issues or questions, contact:
- **Developer:** Yassine Dbaichi
- **Project:** PFE - Geographic Information Science (SIG)
- **Institution:** [Your University Name]

---

*Last Updated: January 2025*
