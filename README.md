# 📚 Book Marketplace with GIS Integration

**End of Study Project (PFE) - Geographic Information Science (SIG)**
**Author:** Yassine Dbaichi
**Institution:** [Your University/Institution]
**Year:** 2024-2025

[![Production Status](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/yourusername/book-marketplace)
[![Backend Deployed](https://img.shields.io/badge/backend-deployed%20on%20vercel-black)](https://vercel.com)
[![GIS Integration](https://img.shields.io/badge/GIS-OpenStreetMap%20%2B%20Route%20Optimization-blue)](https://openstreetmap.org)
[![Documentation](https://img.shields.io/badge/documentation-100%25-blue)](#documentation)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Academic Context](#academic-context)
- [GIS Features & Algorithms](#gis-features--algorithms)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Geospatial Database Schema](#geospatial-database-schema)
- [Installation & Deployment](#installation--deployment)
- [Documentation](#documentation)
- [Academic Contribution](#academic-contribution)
- [Contact](#contact)

---

## 🌟 Overview

A production-ready multi-platform book marketplace application that leverages **Geographic Information Systems (GIS)** for delivery route optimization. This project demonstrates the practical application of GIS technologies in e-commerce logistics, combining web (React), mobile (Flutter), and backend (Node.js) platforms with advanced geospatial features.

### Key Innovations

🗺️ **GIS Integration** - OpenStreetMap, Nominatim geocoding, geospatial indexing
📍 **Route Optimization** - Nearest-neighbor algorithm for delivery planning
🌍 **Geospatial Analysis** - Haversine formula distance calculations
📊 **GeoJSON Export** - Industry-standard geographic data format
🚀 **Production Deployment** - Live backend on Vercel with MongoDB Atlas

---

## 🎓 Academic Context

### Project Type
**PFE (Projet de Fin d'Études)** - End of Study Project
**Field:** Science de l'Information Géographique (SIG) / Geographic Information Science (GIS)

### Problem Statement

Traditional book marketplaces lack geographic intelligence for delivery logistics. Sellers face challenges:
- Manual route planning for multiple deliveries
- No optimization for delivery order
- Limited spatial analysis of customer distribution
- Inefficient distance calculations

### Proposed Solution

A GIS-integrated book marketplace that:
1. **Captures geospatial data** - Buyer and seller locations with coordinates
2. **Optimizes delivery routes** - Nearest-neighbor TSP algorithm
3. **Visualizes spatial data** - Interactive maps with OpenStreetMap
4. **Exports geographic data** - GeoJSON format for external analysis
5. **Calculates distances** - Haversine formula for accurate geodesic calculations

---

## 🗺️ GIS Features & Algorithms

### 1. Geospatial Data Capture

**Location Storage:**
```javascript
// MongoDB GeoJSON format (WGS84)
location: {
  type: "Point",
  coordinates: [longitude, latitude], // [-7.5898, 33.5731] for Casablanca
  address: "123 Boulevard Mohammed V, Casablanca, Morocco"
}
```

**Index Type:** MongoDB 2dsphere index for geospatial queries

**Supported Operations:**
- `$near` - Find locations near a point
- `$geoWithin` - Find points within polygon
- `$geoIntersects` - Check geometry intersection

### 2. Haversine Distance Algorithm

**Purpose:** Calculate great-circle distance between two points on Earth

**Formula Implementation:**
```dart
/// Calculate distance between two geographic points using Haversine formula
///
/// The Haversine formula determines the great-circle distance between two
/// points on a sphere given their longitudes and latitudes.
///
/// Formula:
///   a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
///   c = 2 × atan2(√a, √(1−a))
///   d = R × c
///
/// Where:
///   φ = latitude in radians
///   λ = longitude in radians
///   R = Earth's radius (6,371 km)
///
/// Accuracy: ±0.5% error for distances < 1000km
/// Time Complexity: O(1)
double calculateDistance(LatLng point1, LatLng point2) {
  const double earthRadius = 6371.0; // km

  double lat1 = point1.latitude * pi / 180;
  double lat2 = point2.latitude * pi / 180;
  double deltaLat = (point2.latitude - point1.latitude) * pi / 180;
  double deltaLng = (point2.longitude - point1.longitude) * pi / 180;

  double a = sin(deltaLat / 2) * sin(deltaLat / 2) +
             cos(lat1) * cos(lat2) *
             sin(deltaLng / 2) * sin(deltaLng / 2);

  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return earthRadius * c;
}
```

**Accuracy:** ±0.5% for distances < 1000km (sufficient for urban delivery)

### 3. Route Optimization Algorithm

**Problem:** Traveling Salesman Problem (TSP) variant
**Algorithm:** Nearest-Neighbor Greedy Heuristic
**Time Complexity:** O(n²) where n = number of delivery points

**Implementation:**
```dart
/// Optimize delivery route using nearest-neighbor algorithm
///
/// ALGORITHM: Greedy Nearest-Neighbor for TSP
/// -----------------------------------------
/// Input:
///   - start: Starting point (seller location)
///   - deliveryPoints: List of delivery locations
///
/// Output:
///   - Ordered list of points forming optimized route
///
/// Steps:
///   1. Start at seller location
///   2. Find nearest unvisited delivery point
///   3. Move to that point
///   4. Repeat until all points visited
///
/// Performance:
///   - Time Complexity: O(n²)
///   - Space Complexity: O(n)
///   - Average solution quality: 125% of optimal (within 25% of best)
///
/// Limitations:
///   - Not guaranteed optimal (NP-hard problem)
///   - Local optima may occur
///   - Better for 5-20 points; consider 2-opt for larger sets
List<LatLng> optimizeRoute(LatLng start, List<LatLng> deliveryPoints) {
  if (deliveryPoints.isEmpty) return [start];

  List<LatLng> optimizedRoute = [start];
  List<LatLng> unvisited = List.from(deliveryPoints);
  LatLng currentPoint = start;

  while (unvisited.isNotEmpty) {
    // Find nearest unvisited point
    LatLng? nearestPoint;
    double minDistance = double.infinity;

    for (LatLng point in unvisited) {
      double distance = calculateDistance(currentPoint, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    if (nearestPoint != null) {
      optimizedRoute.add(nearestPoint);
      unvisited.remove(nearestPoint);
      currentPoint = nearestPoint;
    }
  }

  return optimizedRoute;
}
```

**Performance Characteristics:**
- Works well for 5-20 delivery points (typical use case)
- Returns route within 25% of optimal solution
- Fast execution even on mobile devices
- Can be enhanced with 2-opt or genetic algorithms for larger datasets

### 4. Turn-by-Turn Routing (OpenRouteService)

**API Integration:** OpenRouteService Directions API
**Routing Profile:** Driving car
**Features:**
- Step-by-step navigation instructions
- Estimated time and distance
- Route geometry (polyline coordinates)
- Elevation data (optional)

**Implementation:**
```dart
Future<Map<String, dynamic>> getRoute(List<LatLng> waypoints) async {
  final coordinates = waypoints
      .map((point) => [point.longitude, point.latitude])
      .toList();

  final response = await http.post(
    Uri.parse('https://api.openrouteservice.org/v2/directions/driving-car/geojson'),
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'coordinates': coordinates,
      'instructions': true,
      'elevation': false,
    }),
  );

  return jsonDecode(response.body);
}
```

### 5. GeoJSON Export

**Format:** RFC 7946 (GeoJSON Specification)
**Purpose:** Interoperability with GIS tools (QGIS, ArcGIS, etc.)

**Example Export:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-7.5898, 33.5731]
      },
      "properties": {
        "bookTitle": "The Great Gatsby",
        "buyerName": "Ahmed El Fassi",
        "quantity": 2,
        "totalPrice": 240.00,
        "orderStatus": "confirmed",
        "deliveryAddress": "Casablanca, Morocco"
      }
    }
  ]
}
```

**Use Cases:**
- Import into QGIS for spatial analysis
- Create heatmaps of customer distribution
- Analyze delivery zones
- Generate reports with geographic context

### 6. Geocoding Integration

**Service:** Nominatim (OpenStreetMap)
**Features:**
- Forward geocoding: Address → Coordinates
- Reverse geocoding: Coordinates → Address
- Autocomplete suggestions

**Rate Limiting:** 1 request/second (per usage policy)
**Caching:** 15-minute cache for repeated requests
**Fallback:** Manual coordinate entry if geocoding fails

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
├─────────────────────────┬───────────────────────────────────────┤
│   Web Application       │     Mobile Application                │
│   (React + Vite)        │     (Flutter)                         │
│                         │                                        │
│   Features:             │     Features (Sellers Only):          │
│   - Browse books        │     - Order management                │
│   - Place orders        │     - Delivery route planning         │
│   - View maps           │     - GIS route optimization          │
│   - Track orders        │     - GeoJSON export                  │
└─────────────────────────┴───────────────────────────────────────┘
                            │
                            │ HTTPS/REST API (JWT Auth)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
│                   Node.js + Express (Vercel)                    │
│                                                                  │
│   API Endpoints:                                                │
│   - /api/auth      → Authentication (JWT)                       │
│   - /api/books     → Book CRUD operations                       │
│   - /api/orders    → Order management                           │
│   - /api/geojson   → GeoJSON export                            │
│                                                                  │
│   Middleware:                                                   │
│   - JWT verification                                            │
│   - CORS handling                                               │
│   - Error handling                                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                     │
│                    MongoDB Atlas (Cloud)                        │
│                                                                  │
│   Collections:                                                  │
│   - users         → User profiles with GeoJSON locations        │
│   - books         → Book listings                              │
│   - orders        → Orders with buyer/seller GeoJSON coords    │
│   - geojsonexports → Exported route data                       │
│                                                                  │
│   Indexes:                                                      │
│   - 2dsphere on location fields (geospatial queries)           │
│   - Text index on book titles/authors                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ External APIs
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL GIS SERVICES                        │
│                                                                  │
│   OpenStreetMap:                                                │
│   - Map tiles → https://tile.openstreetmap.org                 │
│   - Nominatim → Geocoding API                                  │
│                                                                  │
│   OpenRouteService:                                             │
│   - Directions API → Turn-by-turn routing                      │
│   - Optimization API → TSP solver (alternative)                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow for Route Optimization

```
1. Seller opens mobile app
   ↓
2. App fetches confirmed orders with buyer locations (GeoJSON)
   ↓
3. User selects orders for delivery tour
   ↓
4. Flutter app extracts coordinates from GeoJSON
   ↓
5. Nearest-neighbor algorithm runs locally (O(n²))
   ↓
6. Optimized waypoint order determined
   ↓
7. Waypoints sent to OpenRouteService API
   ↓
8. Turn-by-turn route with geometry returned
   ↓
9. Route displayed on map with visual polyline
   ↓
10. User can export as GeoJSON for external analysis
```

---

## 🛠️ Technology Stack

### Frontend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 19.1.1 | Web UI framework |
| **Build Tool** | Vite 7.1.2 | Fast dev server & bundler |
| **Routing** | React Router 7.8.2 | Client-side navigation |
| **State Management** | Context API + useReducer | Global auth state |
| **HTTP Client** | Axios 1.11.0 | API communication |
| **UI Framework** | Bootstrap 5.3.7 | Responsive design |
| **Icons** | Bootstrap Icons 1.13.1 | Icon library |
| **Maps** | React Leaflet 5.0.0 | Interactive maps |
| **Map Library** | Leaflet 1.9.4 | Mapping engine |
| **Alerts** | SweetAlert2 11.15.2 | User notifications |

### Backend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express 4.18.2 | Web framework |
| **Database** | MongoDB 5.0+ | NoSQL database |
| **ODM** | Mongoose 8.0.3 | MongoDB object modeling |
| **Authentication** | JWT 9.0.2 | Token-based auth |
| **Password Hashing** | bcryptjs 2.4.3 | Secure password storage |
| **CORS** | CORS 2.8.5 | Cross-origin requests |
| **File Upload** | Multer 1.4.5 | Image uploads |
| **Environment** | dotenv 16.3.1 | Config management |
| **Testing** | Jest 29.7.0 | Unit testing |

### Mobile Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Flutter 3.9.0+ | Cross-platform mobile |
| **Language** | Dart 3.9.0+ | Programming language |
| **Maps** | flutter_map 6.1.0 | Mobile mapping |
| **Geolocation** | latlong2 0.9.1 | Coordinate math |
| **Location Services** | geolocator 10.1.0 | GPS access |
| **HTTP** | Dio 5.4.0 | Advanced HTTP client |
| **Secure Storage** | flutter_secure_storage 9.0.0 | Encrypted token storage |
| **Logging** | Logger 2.0.0 | Debug logging |

### GIS & Mapping Services

| Service | Purpose | License |
|---------|---------|---------|
| **OpenStreetMap** | Map tiles | ODbL |
| **Nominatim** | Geocoding | ODbL |
| **OpenRouteService** | Routing API | Custom API key |
| **GeoJSON** | Data format | RFC 7946 |

---

## 📁 Project Structure

```
book-marketplace-flutter/
│
├── docs/                              # 📚 Documentation
│   ├── BACKEND_API.md                # Complete API reference
│   ├── FRONTEND_WEB.md               # Web app documentation
│   └── FLUTTER_APP.md                # Mobile app guide
│
├── backend/                           # 🖥️ Node.js Backend API
│   ├── api/
│   │   └── index.js                  # Vercel serverless entry
│   ├── models/
│   │   ├── User.js                   # User with GeoJSON location
│   │   ├── Book.js                   # Book listings
│   │   ├── Order.js                  # Orders with buyer/seller coords
│   │   └── GeoJSONExport.js          # Exported route data
│   ├── routes/
│   │   ├── auth.js                   # JWT authentication
│   │   ├── books.js                  # Book CRUD
│   │   ├── orders.js                 # Order management
│   │   └── geojson.js                # GeoJSON export
│   ├── middleware/
│   │   └── auth.js                   # JWT verification
│   ├── vercel.json                   # Vercel deployment config
│   └── package.json
│
├── frontend/                          # 🌐 React Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx        # Navigation
│   │   │   │   ├── BookCard.jsx      # Book display
│   │   │   │   ├── MapPicker.jsx     # Location selector
│   │   │   │   └── LocationMap.jsx   # Map display
│   │   │   └── layout/
│   │   ├── pages/
│   │   │   ├── Marketplace.jsx       # Browse books
│   │   │   ├── BookDetails.jsx       # Book info
│   │   │   ├── Orders.jsx            # Order management
│   │   │   └── Profile.jsx           # User profile
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth state (100% documented)
│   │   ├── services/
│   │   │   └── api.js                # API client (100% documented)
│   │   └── App.jsx
│   └── package.json
│
├── lib/                               # 📱 Flutter Mobile App (Sellers)
│   ├── models/                       # 100% DartDoc coverage
│   │   ├── auth_response.dart        # Auth models
│   │   ├── order.dart                # Order models (5 classes)
│   │   └── user.dart                 # User models (4 classes)
│   ├── services/                     # 100% DartDoc coverage
│   │   ├── api_service.dart          # HTTP client (350 lines)
│   │   ├── auth_service.dart         # Authentication (343 lines)
│   │   ├── order_service.dart        # Order operations (350 lines)
│   │   └── route_service.dart        # 🗺️ GIS ALGORITHMS (640 lines)
│   │       ├── Haversine distance calculation
│   │       ├── Nearest-neighbor TSP optimization
│   │       └── OpenRouteService integration
│   ├── utils/
│   │   ├── constants.dart            # App configuration
│   │   └── secure_storage.dart       # Encrypted storage
│   ├── pages/
│   │   ├── login_page.dart           # Seller login
│   │   ├── seller_orders_page.dart   # Order dashboard
│   │   ├── order_map_page.dart       # Map visualization
│   │   └── order_tour_selection_page.dart  # 🗺️ Route planning UI
│   └── main.dart                     # App entry point
│
├── android/                           # Android configuration
│   └── app/
│       ├── build.gradle.kts          # minSdk 24
│       └── src/main/AndroidManifest.xml  # Permissions
│
├── ios/                               # iOS configuration
│
└── README.md                          # This file
```

### Key Files for GIS Features

| File | Lines | Purpose | GIS Features |
|------|-------|---------|--------------|
| `lib/services/route_service.dart` | 640 | Route optimization | Haversine, TSP, OpenRouteService |
| `lib/pages/order_tour_selection_page.dart` | ~400 | Route planning UI | Order selection, route display |
| `lib/pages/order_map_page.dart` | ~300 | Map visualization | Interactive markers, clustering |
| `backend/models/Order.js` | ~150 | Order schema | GeoJSON Point storage |
| `backend/routes/geojson.js` | ~200 | GeoJSON export | FeatureCollection generation |

---

## 🗄️ Geospatial Database Schema

### User Collection (with GeoJSON)

```javascript
{
  _id: ObjectId("..."),
  email: "seller@example.com",
  password: "$2a$10$...", // bcrypt hash
  userType: "seller", // or "buyer"
  phone: "+212612345678",

  profile: {
    firstName: "Yassine",
    lastName: "Dbaichi",
    bio: "Book seller in Casablanca",
    avatar: "https://..."
  },

  // GeoJSON Point (WGS84 coordinate system)
  location: {
    type: "Point",
    coordinates: [-7.5898, 33.5731], // [longitude, latitude]
    address: "Boulevard Mohammed V, Casablanca, Morocco"
  },

  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:00:00Z")
}
```

**Indexes:**
```javascript
db.users.createIndex({ "location": "2dsphere" }) // Geospatial index
db.users.createIndex({ email: 1 }, { unique: true })
```

**Geospatial Queries:**
```javascript
// Find sellers within 5km of buyer
db.users.find({
  userType: "seller",
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-7.6, 33.6]
      },
      $maxDistance: 5000 // meters
    }
  }
})
```

### Order Collection (with Buyer Location)

```javascript
{
  _id: ObjectId("..."),
  buyer: ObjectId("..."), // ref to User
  seller: ObjectId("..."), // ref to User
  book: ObjectId("..."), // ref to Book

  quantity: 2,
  totalPrice: 240.00,
  status: "confirmed", // pending, confirmed, delivered, refused

  // Buyer's delivery location (GeoJSON)
  buyerLocation: {
    type: "Point",
    coordinates: [-7.5950, 33.5850],
    address: "Rue Al Massira, Casablanca"
  },

  // Seller's location (captured at order time)
  sellerLocation: {
    type: "Point",
    coordinates: [-7.5898, 33.5731],
    address: "Boulevard Mohammed V, Casablanca"
  },

  buyerNotes: "Please call before delivery",
  sellerNotes: "Will deliver tomorrow at 3 PM",

  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-16T14:30:00Z")
}
```

**Indexes:**
```javascript
db.orders.createIndex({ "buyerLocation": "2dsphere" })
db.orders.createIndex({ "sellerLocation": "2dsphere" })
db.orders.createIndex({ seller: 1, status: 1 }) // For seller dashboard
db.orders.createIndex({ buyer: 1, createdAt: -1 }) // For buyer history
```

**Geospatial Aggregation:**
```javascript
// Get all confirmed orders for a seller with locations
db.orders.aggregate([
  { $match: { seller: ObjectId("..."), status: "confirmed" } },
  { $lookup: { from: "users", localField: "buyer", foreignField: "_id", as: "buyerData" } },
  { $lookup: { from: "books", localField: "book", foreignField: "_id", as: "bookData" } },
  { $project: {
      bookTitle: { $arrayElemAt: ["$bookData.title", 0] },
      buyerName: { $arrayElemAt: ["$buyerData.profile.firstName", 0] },
      buyerLocation: 1,
      quantity: 1,
      totalPrice: 1
    }
  }
])
```

### GeoJSON Export Collection

```javascript
{
  _id: ObjectId("..."),
  name: "Delivery Tour - December 2024",
  user: ObjectId("..."), // ref to User (seller)

  data: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-7.5950, 33.5850]
        },
        properties: {
          orderId: "...",
          bookTitle: "The Great Gatsby",
          buyerName: "Ahmed El Fassi",
          quantity: 2,
          totalPrice: 240.00
        }
      },
      // ... more features
    ]
  },

  createdAt: ISODate("2024-12-15T10:00:00Z")
}
```

---

## 🚀 Installation & Deployment

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Flutter SDK 3.9.0+
- Dart 3.9.0+

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/book-marketplace-flutter.git
cd book-marketplace-flutter

# Backend setup
cd backend
npm install
cp .env.example .env # Configure MongoDB URI, JWT secret
npm run dev # Starts on http://localhost:5000

# Frontend setup
cd ../frontend
npm install
npm run dev # Starts on http://localhost:5173

# Mobile setup
flutter pub get
flutter run # Runs on connected device/emulator
```

### Production Deployment

**Backend (Vercel):**
```bash
cd backend
vercel --prod
```

**Environment Variables:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - Token expiration (default: 7d)
- `NODE_ENV` - production
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend (Vercel/Netlify):**
```bash
cd frontend
npm run build
vercel --prod
```

**Mobile (APK):**
```bash
flutter build apk --release --no-tree-shake-icons
# APK: build/app/outputs/flutter-apk/app-release.apk
```

### Live URLs

- **Backend API:** https://book-marketplace-backend.vercel.app/api
- **Frontend:** [Your deployed frontend URL]
- **Documentation:** [docs/](./docs/)

---

## 📚 Documentation

### Complete Documentation Set

| Document | Description | Lines |
|----------|-------------|-------|
| [BACKEND_API.md](./docs/BACKEND_API.md) | Complete API reference with all endpoints, models, authentication flow | 757 |
| [FRONTEND_WEB.md](./docs/FRONTEND_WEB.md) | React web app guide with components, services, routing | 528 |
| [FLUTTER_APP.md](./docs/FLUTTER_APP.md) | Flutter mobile app with GIS algorithms, architecture | 555 |

### Code Documentation Coverage

| Component | Files | Lines | Documentation |
|-----------|-------|-------|---------------|
| Flutter Services | 4 | 1,683 | 100% DartDoc |
| Flutter Models | 3 | 699 | 100% DartDoc |
| Flutter Utils | 2 | 431 | 100% DartDoc |
| Frontend Context | 1 | 560 | 100% JSDoc |
| **Total** | **10** | **3,373** | **100%** |

### API Documentation

See [BACKEND_API.md](./docs/BACKEND_API.md) for complete API reference including:
- Authentication endpoints
- Book CRUD operations
- Order management
- GeoJSON export endpoints
- Request/response examples
- Error handling

---

## 🎓 Academic Contribution

### Research Questions Addressed

1. **How can GIS technologies improve e-commerce delivery logistics?**
   - Answer: By implementing route optimization algorithms (TSP) and geospatial analysis

2. **What is the performance of nearest-neighbor algorithm for small delivery sets?**
   - Answer: O(n²) complexity, 125% of optimal solution, suitable for 5-20 points

3. **Can open-source GIS tools compete with commercial solutions?**
   - Answer: Yes - OpenStreetMap + OpenRouteService provide production-ready features

4. **How to integrate GIS in modern web/mobile applications?**
   - Answer: GeoJSON standard, 2dsphere indexing, REST APIs with coordinate data

### Technical Contributions

✅ **Production Implementation** - Fully functional GIS-integrated marketplace
✅ **Algorithm Analysis** - Performance testing of nearest-neighbor TSP
✅ **Best Practices** - 100% code documentation with DartDoc/JSDoc
✅ **Open Source Integration** - OpenStreetMap, Nominatim, OpenRouteService
✅ **Deployment Success** - Live backend on Vercel, production APK

### Future Enhancements

🎯 **Advanced Algorithms** - 2-opt optimization for better routes
🎯 **Machine Learning** - Predict delivery times based on traffic
🎯 **Real-time Tracking** - GPS tracking during delivery
🎯 **Spatial Analytics** - Customer distribution heatmaps
🎯 **Multi-modal Routing** - Walking, cycling, public transport

---

## 📞 Contact

**Author:** Yassine Dbaichi
**Project:** PFE - Science de l'Information Géographique (SIG)
**Institution:** [Your University/Institution]
**Year:** 2024-2025

**Email:** [your.email@example.com]
**LinkedIn:** [Your LinkedIn]
**GitHub:** [Your GitHub]

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenStreetMap Contributors** - Map data and tiles (ODbL license)
- **Nominatim** - Free geocoding service
- **OpenRouteService** - Routing and optimization API
- **MongoDB** - Geospatial database capabilities
- **React Team** - Excellent frontend framework
- **Flutter Team** - Outstanding mobile framework
- **Vercel** - Seamless deployment platform
- **Academic Supervisors** - Guidance and support

---

<div align="center">

**Built with ❤️ for Geographic Information Science**

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev)
[![Flutter](https://img.shields.io/badge/Flutter-3.9.0-02569B?logo=flutter)](https://flutter.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0-47A248?logo=mongodb)](https://www.mongodb.com)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-GIS-7EBC6F?logo=openstreetmap)](https://openstreetmap.org)

**PFE 2024-2025 - Yassine Dbaichi**

</div>
