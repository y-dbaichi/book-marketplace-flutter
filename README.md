# Book Marketplace Platform

A comprehensive multi-platform book marketplace application with web (React), mobile (Flutter), and backend (Node.js) components. The platform enables users to buy and sell books with integrated mapping, geolocation features, and delivery route planning.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Third-Party Services](#third-party-services)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Overview

The Book Marketplace Platform is a full-stack application that connects book buyers and sellers. It features:
- **Web Application (React)**: Browse books, manage orders, view seller locations on maps
- **Mobile Application (Flutter)**: Native mobile experience for sellers to manage inventory and plan delivery routes
- **Backend API (Node.js/Express)**: RESTful API with JWT authentication and MongoDB database

---

## Features

### For Buyers (Web Application)
- **User Registration & Authentication**: Secure JWT-based authentication
- **Book Browsing**: Search and filter books by title, author, genre, quality
- **Location-based Search**: Find books near you using interactive maps
- **Order Management**: Track order status with real-time updates
- **Seller Locations**: View seller locations on interactive maps with markers
- **Profile Management**: Update personal information, location, and preferences

### For Sellers (Mobile & Web Application)
- **Book Inventory Management**: Add, edit, and delete book listings
- **Order Management**: Accept or refuse orders, view buyer locations
- **Delivery Route Planning (Tournée)**: AI-powered route optimization for deliveries
- **GeoJSON Export**: Export delivery points for use in external GIS tools
- **Location Tracking**: Automatic seller location capture for buyer visibility
- **Order Analytics**: View order statistics and buyer distribution

### Platform Features
- **Interactive Maps**: Powered by Leaflet/Flutter Map with OpenStreetMap tiles
- **Geocoding**: Forward and reverse geocoding using Nominatim API
- **Real-time Updates**: Auto-refresh order status every 30 seconds
- **Responsive Design**: Mobile-first design with Bootstrap components
- **Secure Authentication**: JWT tokens with refresh token support

---

## Tech Stack

### Frontend (Web Application)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **Vite** | 7.1.2 | Build tool and dev server |
| **React Router DOM** | 7.8.2 | Client-side routing |
| **React Bootstrap** | 2.10.10 | UI component library |
| **Bootstrap** | 5.3.7 | CSS framework |
| **Bootstrap Icons** | 1.13.1 | Icon library |
| **Leaflet** | 1.9.4 | Interactive maps |
| **React Leaflet** | 5.0.0 | React bindings for Leaflet |
| **Axios** | 1.11.0 | HTTP client |
| **SweetAlert2** | 11.15.2 | Beautiful alerts and modals |
| **Vitest** | 3.2.4 | Testing framework |

### Backend (API Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | - | JavaScript runtime |
| **Express** | 4.18.2 | Web framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 8.0.3 | MongoDB ODM |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 2.4.3 | Password hashing |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Multer** | 1.4.5 | File upload handling |
| **dotenv** | 16.3.1 | Environment variables |
| **Jest** | 29.7.0 | Testing framework |
| **Supertest** | 6.3.4 | HTTP assertion library |

### Mobile Application (Flutter)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | SDK 3.9.0+ | Mobile framework |
| **Dart** | 3.9.0+ | Programming language |
| **flutter_map** | 6.1.0 | Interactive maps for Flutter |
| **latlong2** | 0.9.1 | Latitude/longitude calculations |
| **geolocator** | 10.1.0 | Device location services |
| **http** | 1.1.0 | HTTP client |
| **dio** | 5.4.0 | Advanced HTTP client |
| **flutter_secure_storage** | 9.0.0 | Secure token storage |
| **shared_preferences** | 2.2.2 | Local data persistence |
| **connectivity_plus** | 5.0.2 | Network connectivity |
| **url_launcher** | 6.2.2 | Launch URLs and maps |

---

## Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Client    │         │  Mobile Client  │
│  (React/Vite)   │         │    (Flutter)    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │        HTTPS/REST         │
         │      (JWT Auth)           │
         └──────────┬────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Express Server    │
         │   (Node.js API)     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   MongoDB Database  │
         │  (Mongoose ODM)     │
         └─────────────────────┘
```

### Application Flow

1. **Authentication Flow**:
   - User registers/logs in → Backend validates → JWT token issued
   - Token stored in localStorage (web) / secure_storage (mobile)
   - All API requests include JWT in Authorization header
   - Token refresh mechanism for expired tokens

2. **Book Marketplace Flow**:
   - Seller adds book listing with location
   - Book stored in MongoDB with geospatial indexing
   - Buyer browses/searches books
   - Buyer places order with delivery location
   - Seller receives order notification
   - Seller accepts/refuses order
   - Order status tracked in real-time

3. **Route Planning Flow (Tournée)**:
   - Seller views confirmed orders on map
   - System groups orders by proximity
   - AI-powered route optimization
   - Export to GeoJSON for external navigation
   - Update order status during delivery

---

## Third-Party Services

### OpenStreetMap (OSM) Integration

The platform heavily utilizes OpenStreetMap services for mapping and geolocation features:

#### 1. **Tile Servers**
- **Provider**: OpenStreetMap
- **URL Pattern**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Subdomains**: a, b, c
- **Purpose**: Display interactive map tiles
- **License**: © OpenStreetMap contributors (ODbL)

#### 2. **Nominatim Geocoding API**
- **Base URL**: `https://nominatim.openstreetmap.org/`
- **Rate Limit**: 1 request/second (per usage policy)
- **Features Used**:

  **Forward Geocoding** (Address → Coordinates):
  ```
  GET /search?format=json&q={address}&limit=5&addressdetails=1
  ```
  - Search locations by address/name
  - Get autocomplete suggestions
  - Returns coordinates and formatted addresses

  **Reverse Geocoding** (Coordinates → Address):
  ```
  GET /reverse?format=json&lat={lat}&lon={lon}&addressdetails=1
  ```
  - Convert map clicks to addresses
  - Get location names from GPS coordinates
  - Display human-readable location information

#### 3. **Map Interaction Features**
- **Click to Pin**: Users click on map to select exact location
- **Marker Display**: Custom colored markers for buyers (blue) and sellers (pink)
- **Popup Information**: Detailed info cards on marker click
- **Search Autocomplete**: Real-time location suggestions as user types
- **Current Location**: Geolocation API to get user's current position

#### 4. **Implementation Details**

**Web (React Leaflet)**:
```javascript
<MapContainer center={[33.5731, -7.5898]} zoom={13}>
  <TileLayer
    attribution='© OpenStreetMap contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  <Marker position={[lat, lng]} />
</MapContainer>
```

**Mobile (Flutter Map)**:
```dart
FlutterMap(
  options: MapOptions(center: LatLng(33.5731, -7.5898), zoom: 13),
  children: [
    TileLayer(
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    ),
    MarkerLayer(markers: markerList),
  ],
)
```

#### 5. **Usage Compliance**
- Attribution: © OpenStreetMap contributors displayed on all maps
- Rate Limiting: Debounced search requests (300ms delay)
- Caching: 15-minute cache for repeated geocoding requests
- User Agent: Custom user agent identifying the application

---

## Project Structure

```
book-marketplace-flutter/
│
├── backend/                    # Node.js/Express API
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # User model (buyers & sellers)
│   │   ├── Book.js             # Book listing model
│   │   ├── Order.js            # Order model
│   │   └── GeoJSONExport.js    # GeoJSON export tracking
│   ├── routes/                 # API route handlers
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── books.js            # Book CRUD operations
│   │   ├── orders.js           # Order management
│   │   └── geojson.js          # GeoJSON export endpoints
│   ├── middleware/             # Custom middleware
│   │   └── auth.js             # JWT authentication middleware
│   ├── tests/                  # Jest test suites
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── frontend/                   # React web application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Generic components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── MapPicker.jsx        # Location selector
│   │   │   │   ├── LocationMap.jsx       # Display-only map
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   └── layout/         # Layout components
│   │   │       ├── Navbar.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Authentication pages
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── buyer/          # Buyer-specific pages
│   │   │   │   └── BuyerDashboard.jsx
│   │   │   ├── customer/       # Customer pages
│   │   │   │   ├── CustomerOrders.jsx
│   │   │   │   └── Marketplace.jsx
│   │   │   ├── shared/         # Shared pages
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   └── Home.jsx
│   │   │   └── LandingPage.jsx
│   │   ├── context/            # React Context providers
│   │   │   └── AuthContext.jsx
│   │   ├── services/           # API service layer
│   │   │   └── api.js          # Axios instance & API calls
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── lib/                        # Flutter mobile application
│   ├── models/                 # Dart data models
│   │   ├── order.dart
│   │   ├── point.dart
│   │   └── user.dart
│   ├── pages/                  # Flutter screens
│   │   ├── login_page.dart
│   │   ├── home_page.dart
│   │   ├── seller_orders_page.dart
│   │   ├── order_tournee_page.dart    # Route planning
│   │   └── order_map_page.dart
│   ├── services/               # Service layer
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── order_service.dart
│   │   ├── route_service.dart          # TSP route optimization
│   │   └── geocoding_service.dart
│   ├── utils/                  # Utility functions
│   └── main.dart               # Flutter entry point
│
├── android/                    # Android-specific config
├── ios/                        # iOS-specific config
├── pubspec.yaml                # Flutter dependencies
└── README.md                   # This file
```

---

## Database Models

### User Model

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  userType: String (enum: ['buyer', 'seller'], required),
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
      latitude: Number (-90 to 90),
      longitude: Number (-180 to 180)
    },
    address: String
  },
  active: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Book Model

```javascript
{
  title: String (required),
  author: String (required),
  description: String,
  quality: String (enum: ['excellent', 'good', 'fair', 'poor'], required),
  quantity: Number (required, min: 0),
  price: Number (required, min: 0),
  seller: ObjectId (ref: 'User', required),
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  images: [String],
  available: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model

```javascript
{
  buyer: ObjectId (ref: 'User', required),
  seller: ObjectId (ref: 'User', required),
  book: ObjectId (ref: 'Book', required),
  quantity: Number (required, min: 1),
  totalPrice: Number (required),
  status: String (enum: ['pending', 'confirmed', 'delivered', 'refused'], default: 'pending'),
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

### GeoJSONExport Model

```javascript
{
  user: ObjectId (ref: 'User', required),
  geojsonData: Object (type: 'FeatureCollection', required),
  orderIds: [ObjectId] (ref: 'Order'),
  exportDate: Date (default: Date.now)
}
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update user profile | Yes |

### Books (`/api/books`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all books (with filters) | No |
| GET | `/:id` | Get single book | No |
| POST | `/` | Create book listing | Yes (Seller) |
| PUT | `/:id` | Update book | Yes (Seller) |
| DELETE | `/:id` | Delete book | Yes (Seller) |
| GET | `/seller/my-books` | Get seller's books | Yes (Seller) |

**Query Parameters for GET /**:
- `search`: Search by title or author
- `quality`: Filter by quality
- `minPrice`, `maxPrice`: Price range
- `available`: Filter available books

### Orders (`/api/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all orders | Yes |
| GET | `/:id` | Get single order | Yes |
| POST | `/` | Create new order | Yes (Buyer) |
| PUT | `/:id/status` | Update order status | Yes (Seller) |
| GET | `/buyer` | Get buyer's orders | Yes (Buyer) |
| GET | `/seller` | Get seller's orders | Yes (Seller) |

### GeoJSON (`/api/geojson`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | Get orders as GeoJSON | Yes (Seller) |
| POST | `/export` | Export GeoJSON | Yes (Seller) |

---

## Setup Instructions

### Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher (or MongoDB Atlas account)
- **Flutter**: v3.9 or higher
- **Dart**: v3.9 or higher
- **npm** or **yarn**: Latest version

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

4. **Start MongoDB**:
   ```bash
   # Local MongoDB
   mongod

   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** (if needed):
   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open browser at `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```

### Flutter Mobile App Setup

1. **Navigate to project root**:
   ```bash
   cd /path/to/book-marketplace-flutter
   ```

2. **Install Flutter dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint**:
   Edit `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:5000/api';
   ```
   Note: Use your computer's IP address, not localhost, for mobile testing

4. **Run on emulator/device**:
   ```bash
   # Check connected devices
   flutter devices

   # Run on specific device
   flutter run -d <device_id>

   # Run in debug mode
   flutter run
   ```

5. **Build for production**:
   ```bash
   # Android
   flutter build apk --release

   # iOS
   flutter build ios --release
   ```

---

## Environment Variables

### Backend (`.env`)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/book-marketplace
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/book-marketplace

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload (if using Multer)
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# OpenStreetMap (optional - for rate limiting)
OSM_USER_AGENT=BookMarketplace/1.0
```

### Frontend (`.env`)

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Map Configuration (optional)
VITE_MAP_DEFAULT_LAT=33.5731
VITE_MAP_DEFAULT_LNG=-7.5898
VITE_MAP_DEFAULT_ZOOM=13
```

### Flutter (No .env file needed)

Configuration is hardcoded in `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://192.168.1.100:5000/api';
```

---

## Testing

### Backend Testing

The backend uses **Jest** and **Supertest** for comprehensive testing:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch
```

**Test Coverage Areas**:
- Unit tests: Models, utilities, middleware
- Integration tests: API endpoints, database operations
- E2E tests: Complete user workflows

### Frontend Testing

The frontend uses **Vitest** and **React Testing Library**:

```bash
# Run tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

**Test Coverage Areas**:
- Component rendering
- User interactions
- API integration
- Route navigation

### Manual Testing

**Postman Collections**:
- `Book_Marketplace_API_Complete.postman_collection.json`
- `Book_Marketplace_API_Automated.postman_collection.json`

Import into Postman for manual API testing.

---

## Key Features in Detail

### 1. Route Planning (Tournée)

The Flutter app includes an advanced delivery route planning feature:

- **TSP Algorithm**: Traveling Salesman Problem solver for optimal routes
- **Visual Route Display**: Route shown on map with numbered waypoints
- **Distance Calculation**: Total distance and individual segment distances
- **GeoJSON Export**: Export delivery points for use in navigation apps
- **Order Grouping**: Automatically groups orders by proximity

**Implementation**: `lib/services/route_service.dart`

### 2. Real-time Order Tracking

Orders auto-refresh every 30 seconds to show status updates:

- **Pending**: Awaiting seller confirmation
- **Confirmed**: Seller accepted, preparing for delivery
- **Delivered**: Order completed successfully
- **Refused**: Seller declined the order

**Implementation**: `frontend/src/pages/customer/CustomerOrders.jsx`

### 3. Interactive Map Features

#### MapPicker Component
- Click-to-pin location selection
- Search with autocomplete
- Current location detection
- Reverse geocoding for address display

**Implementation**: `frontend/src/components/common/MapPicker.jsx`

#### LocationMap Component
- Display multiple markers (buyers/sellers)
- Custom colored markers by type
- Detailed popup information
- Auto-center based on points

**Implementation**: `frontend/src/components/common/LocationMap.jsx`

### 4. Authentication & Security

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **Token Refresh**: Automatic token renewal
- **Route Protection**: Middleware-based auth checks
- **Secure Storage**: flutter_secure_storage for mobile tokens

---

## API Rate Limits & Best Practices

### OpenStreetMap Nominatim

- **Limit**: 1 request per second
- **Implementation**: 300ms debounce on search input
- **Caching**: 15-minute cache for repeated searches
- **User Agent**: Custom identifier required

### Best Practices

1. **Always include attribution** when using OSM tiles
2. **Implement debouncing** for search requests
3. **Cache geocoding results** to reduce API calls
4. **Use environment variables** for configuration
5. **Validate coordinates** before storing (lat: -90 to 90, lng: -180 to 180)
6. **Handle offline scenarios** gracefully in mobile app

---

## Deployment

### 🚀 Quick Deploy to Vercel

The easiest way to deploy this application is using Vercel:

```bash
# One-command deployment
./deploy.sh
```

**For detailed deployment instructions, see:**
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 5-minute quick start
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Configuration reference

### Backend Deployment (Vercel - Recommended)

**Automated Deployment:**
```bash
cd backend
vercel --prod
```

**Environment Variables to Set:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Strong random 32+ character secret
- `JWT_EXPIRE`: `7d`
- `NODE_ENV`: `production`
- `FRONTEND_URL`: Your frontend Vercel URL

### Frontend Deployment (Vercel - Recommended)

**Automated Deployment:**
```bash
cd frontend
vercel --prod
```

**Environment Variables to Set:**
- `VITE_API_URL`: Your backend Vercel URL + `/api`

### Alternative: Heroku Deployment

**Backend (Heroku):**
```bash
heroku login
heroku create book-marketplace-api
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

**Frontend (Netlify/Vercel):**
- Connect your Git repository
- Set `VITE_API_URL` in environment variables
- Automatic deployments on push

### Mobile App Deployment

**Android**:
1. Update `android/app/build.gradle` with signing config
2. Build release APK: `flutter build apk --release`
3. Upload to Google Play Console

**iOS**:
1. Configure signing in Xcode
2. Build release: `flutter build ios --release`
3. Upload to App Store Connect

**Flutter Web** (Optional):
```bash
flutter build web
# Deploy the build/web directory to any static hosting
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- **JavaScript/React**: Follow Airbnb style guide
- **Dart/Flutter**: Follow official Flutter style guide
- **Commit Messages**: Use conventional commits format

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- **OpenStreetMap**: Map tiles and geocoding services
- **Leaflet/Flutter Map**: Excellent mapping libraries
- **React Team**: Amazing frontend framework
- **Flutter Team**: Outstanding mobile framework
- **MongoDB**: Flexible NoSQL database

---

## Contact & Support

For questions, issues, or suggestions:
- Create an issue on GitHub
- Email: support@bookmarketplace.com
- Documentation: https://docs.bookmarketplace.com

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Web and mobile applications
- Book marketplace features
- Order management
- Route planning (Tournée)
- Interactive maps with OSM
- JWT authentication
- GeoJSON export

---

**Built with ❤️ using React, Flutter, and Node.js**
