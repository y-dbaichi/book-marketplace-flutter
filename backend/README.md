# Book Marketplace Backend API

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file and update:

```env
# MongoDB Connection - Replace with your Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ydkd2g2.mongodb.net/bookmarketplace?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret - Change this to a secure random string
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. MongoDB Atlas Setup
1. Go to your MongoDB Atlas dashboard
2. Create a database user:
   - Username: `bookmarketplace_user`
   - Password: (generate strong password)
3. Update the `MONGODB_URI` in `.env` with your credentials
4. Whitelist your IP address (or use 0.0.0.0/0 for development)

### 4. Start the Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user (buyer or customer)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Books (`/api/books`)
- `GET /api/books` - Get all available books (with search/filters)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book listing (buyers only)
- `PUT /api/books/:id` - Update book listing (owner only)
- `DELETE /api/books/:id` - Delete book listing (owner only)
- `GET /api/books/my/listings` - Get buyer's listings

### Orders (`/api/orders`)
- `POST /api/orders` - Create new order (customers only)
- `GET /api/orders/my/customer` - Get customer's orders
- `GET /api/orders/my/buyer` - Get buyer's received orders
- `PUT /api/orders/:id/status` - Update order status

### GeoJSON Exports (`/api/geojson`)
- `POST /api/geojson/generate` - Generate GeoJSON export
- `GET /api/geojson/my-exports` - Get user's exports
- `GET /api/geojson/download/:id` - Download GeoJSON file
- `GET /api/geojson/preview/:id` - Preview GeoJSON (first 10 features)
- `DELETE /api/geojson/:id` - Delete export

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 👥 User Types

### Buyers (Book Sellers)
- Can create, update, delete book listings
- Receive and manage orders from customers
- Can update order status (confirm, prepare, ready, etc.)
- Can generate GeoJSON exports of their orders

### Customers (Book Buyers)
- Can browse and search books
- Can place orders (pickup or delivery)
- Can track their order status
- Can generate GeoJSON exports of their orders

## 📊 Database Collections

### Users
- User authentication and profile data
- Location information (approximate for security)
- User type (buyer/customer)

### Books
- Book listings with details (title, author, quality, etc.)
- Pricing and availability
- Reference to buyer (seller)

### Orders
- Order details and workflow status
- Location data for both parties
- Order type (pickup/delivery)

### GeoJSONExports
- Generated GeoJSON files for mobile app integration
- Export metadata and download tracking
- Automatic expiration after 30 days

## 🗺️ GeoJSON Integration

The system generates GeoJSON files that can be imported into the Flutter mobile app for route planning and navigation. Each export contains:

- **Point locations** with coordinates
- **Order information** (book details, contact info)
- **Point types** (pickup/delivery locations)
- **Contact details** for calling customers/buyers

## 🔧 Development

### Testing the API
Use tools like Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Register a buyer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@example.com",
    "password": "password123",
    "userType": "buyer",
    "phone": "+1234567890",
    "location": {
      "name": "Downtown Bookstore",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "address": "123 Main St, New York, NY"
    }
  }'
```

### Database Indexes
The models include appropriate indexes for:
- Text search on books
- User queries by type and status
- Order queries by participants
- GeoJSON export queries

## 🚀 Next Steps
1. Set up the React frontend
2. Test the complete workflow
3. Integrate with the Flutter mobile app
4. Deploy to production
