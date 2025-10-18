# Flutter Mobile App Documentation

## Overview

Android mobile application for sellers to manage book deliveries and plan delivery routes. Built with Flutter for cross-platform compatibility.

**Platform:** Android (iOS compatible)
**Target Users:** Book sellers only
**Primary Purpose:** Delivery management and route optimization

## Technology Stack

- **Framework:** Flutter 3.x / Dart 3.x
- **State Management:** Provider pattern
- **HTTP Client:** Dio with interceptors
- **Secure Storage:** flutter_secure_storage
- **Maps:** flutter_map with OpenStreetMap
- **Routing API:** OpenRouteService
- **Authentication:** JWT tokens

## Application Architecture

```
lib/
├── main.dart                    # App entry point
├── models/                      # Data models
│   ├── user.dart               # User, Profile, Location models
│   ├── order.dart              # Order, Book, OrderLocation models
│   └── auth_response.dart      # Authentication response model
├── services/                    # Business logic layer
│   ├── auth_service.dart       # Authentication & JWT management
│   ├── api_service.dart        # HTTP client with Dio
│   ├── order_service.dart      # Order operations
│   └── route_service.dart      # Route optimization (OpenRouteService)
├── pages/                       # UI screens
│   ├── login_page.dart         # Seller authentication
│   ├── seller_orders_page.dart # Order management dashboard
│   ├── order_map_page.dart     # Interactive map view
│   └── order_tour_selection_page.dart # Route planning
└── utils/
    └── constants.dart           # App-wide constants
```

## Features

### 1. Authentication
- **Seller-only login** (buyers blocked)
- JWT token management
- Automatic token refresh
- Secure storage with flutter_secure_storage

### 2. Order Management
- View all orders with tab filtering:
  - All orders
  - To deliver (confirmed)
  - Delivered
  - Pending
- Order status updates:
  - pending → confirmed → delivered
  - pending → refused
  - confirmed → refused
- Seller notes for each order
- Pull-to-refresh functionality

### 3. Geographic Features
- **Interactive Map View:**
  - OpenStreetMap integration
  - Custom markers for delivery points
  - Quantity badges on markers
  - Order details on marker tap

- **Route Optimization:**
  - Nearest-neighbor algorithm for route planning
  - Turn-by-turn directions
  - Distance and duration calculations
  - OpenRouteService API integration

### 4. Delivery Planning
- Select orders for delivery tour
- Automatic route optimization
- Visual route display on map
- Export route as GeoJSON

## Core Services

### AuthService
**Location:** `lib/services/auth_service.dart`

Handles user authentication and session management.

**Key Methods:**
```dart
// Login (sellers only)
Future<AuthResponse> login(String email, String password)

// Logout
Future<void> logout()

// Check authentication status
bool get isAuthenticated

// Get current user
User? get currentUser
```

**Features:**
- JWT token storage in FlutterSecureStorage
- Automatic seller validation
- French error messages
- Session persistence

### ApiService
**Location:** `lib/services/api_service.dart`

HTTP client with automatic JWT token injection.

**Features:**
- Dio interceptors for request/response handling
- Automatic token refresh on 401 errors
- Request/response logging
- Error handling

**Configuration:**
```dart
// Base URL from environment
final String baseUrl = const String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://book-marketplace-backend.vercel.app/api',
);
```

### OrderService
**Location:** `lib/services/order_service.dart`

Manages order operations.

**Key Methods:**
```dart
// Get seller's orders
Future<List<Order>> getSellerOrders({String? status})

// Update order status
Future<Order> updateOrderStatus(
  String orderId,
  String newStatus,
  {String? notes}
)
```

**Status Flow:**
```
pending → confirmed → delivered
        ↘ refused
```

### RouteService
**Location:** `lib/services/route_service.dart`

Route optimization and directions.

**Key Methods:**
```dart
// Optimize delivery order
List<LatLng> optimizeRoute(
  LatLng start,
  List<LatLng> deliveryPoints,
)

// Get route from OpenRouteService
Future<Map<String, dynamic>> getRoute(List<LatLng> waypoints)

// Calculate distance between points
double calculateDistance(LatLng point1, LatLng point2)
```

**Algorithm:**
- Nearest-neighbor (greedy) algorithm
- Time complexity: O(n²)
- Haversine formula for distance calculations

## Data Models

### User Model
```dart
class User {
  final String id;
  final String email;
  final String userType; // 'buyer' or 'seller'
  final String? phone;
  final Profile? profile;
  final UserLocation? location;

  // Getters
  String get displayName; // firstName + lastName or email
}

class Profile {
  final String? firstName;
  final String? lastName;
  final String? bio;
  final String? avatar;
}

class UserLocation {
  final double latitude;
  final double longitude;
  final String? address;
}
```

### Order Model
```dart
class Order {
  final String id;
  final Book book;
  final Buyer buyer;
  final int quantity;
  final double totalPrice;
  final String status; // pending, confirmed, delivered, refused
  final OrderLocation? buyerLocation;
  final String? buyerNotes;
  final String? sellerNotes;
  final DateTime createdAt;

  // Computed properties
  bool get isConfirmed => status == 'confirmed';
  bool get isDelivered => status == 'delivered';
  bool get isPending => status == 'pending';
  String get buyerName; // buyer's full name
  String get statusDisplay; // Localized status in French
}

class Book {
  final String title;
  final String author;
  final double price;
  final String? coverUrl;
}

class Buyer {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
}

class OrderLocation {
  final double latitude;
  final double longitude;
  final String? address;

  // Convert to LatLng for maps
  LatLng toLatLng();
}
```

### AuthResponse Model
```dart
class AuthResponse {
  final String message;
  final String token; // JWT token (valid 7 days)
  final User user;
}
```

## Screens

### Login Page
**File:** `lib/pages/login_page.dart`

**Purpose:** Authenticate sellers

**Features:**
- Email and password input
- Form validation
- Loading state
- Error display
- Auto-navigation to orders page

**Restrictions:** Only sellers can log in. Buyers are blocked with error message.

### Seller Orders Page
**File:** `lib/pages/seller_orders_page.dart`

**Purpose:** Main dashboard for order management

**Features:**
- **Tab Filtering:**
  - All orders
  - To deliver (confirmed)
  - Delivered
  - Pending

- **Order Cards:**
  - Book title and author
  - Customer name and phone
  - Delivery address
  - Order quantity and price
  - Status indicator (color-coded)

- **Actions:**
  - View order details
  - Update order status
  - Add seller notes
  - Navigate to map view
  - Plan delivery tour

- **Floating Action Buttons:**
  - 📍 Map View - Show all confirmed orders on map
  - 🗺️ Plan Tour - Optimize delivery route

### Order Map Page
**File:** `lib/pages/order_map_page.dart`

**Purpose:** Visual representation of delivery points

**Features:**
- Interactive OpenStreetMap
- Custom markers for each order
- Quantity badge on markers
- Marker selection with auto-zoom
- Order details bottom sheet
- Legend

**Marker Colors:**
- Blue: Normal delivery point
- Red: Selected delivery point

### Order Tour Selection Page
**File:** `lib/pages/order_tour_selection_page.dart`

**Purpose:** Select orders and plan optimized route

**Features:**
- Multi-select order list
- Route optimization button
- Optimized route visualization
- Turn-by-turn directions
- Distance and duration estimates
- Export route as GeoJSON

## Configuration

### Environment Variables

Set during build or in `lib/utils/constants.dart`:

```dart
// API Base URL
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://book-marketplace-backend.vercel.app/api',
);

// OpenRouteService API Key
const String openRouteServiceApiKey = String.fromEnvironment(
  'OPENROUTE_API_KEY',
  defaultValue: 'your-api-key-here',
);
```

### Android Permissions

Required permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Internet access for API calls -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Location services -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Background location (for route tracking) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Network state -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Building the App

### Debug Build
```bash
flutter build apk --debug
```

### Release Build
```bash
flutter build apk --release --no-tree-shake-icons
```

**Note:** `--no-tree-shake-icons` flag ensures Material Icons are included in release build.

### Build with Custom API URL
```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-api.com/api \
  --dart-define=OPENROUTE_API_KEY=your-key
```

### Output Location
```
build/app/outputs/flutter-apk/app-release.apk
```

## Installation

### Install on Android Device

**Via USB:**
```bash
flutter install
```

**Via APK:**
1. Transfer `app-release.apk` to device
2. Enable "Install from Unknown Sources" in Android settings
3. Open APK file to install

### Minimum Requirements
- Android 6.0 (API level 23) or higher
- 50 MB free storage
- Internet connection

## Dependencies

Key packages from `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # HTTP & API
  dio: ^5.4.0                    # HTTP client
  http: ^1.1.0                   # Secondary HTTP client

  # State & Storage
  flutter_secure_storage: ^9.0.0  # Secure token storage

  # Maps & Location
  flutter_map: ^6.2.1            # Map widget
  latlong2: ^0.9.0               # Lat/lng data types
  geolocator: ^10.1.0            # Location services

  # UI
  logger: ^2.0.0                 # Logging
```

## Testing

### Test Credentials

Use existing seller accounts or register via web app:

```
Email: seller@example.com
Password: password123
```

**Note:** Only users with `userType: 'seller'` can log into the Flutter app.

### Testing Workflow

1. **Login:**
   - Open app
   - Enter seller credentials
   - Verify successful login and navigation to orders page

2. **View Orders:**
   - Check all tabs (All, To Deliver, Delivered, Pending)
   - Verify orders display correctly
   - Test pull-to-refresh

3. **Update Order Status:**
   - Tap an order
   - Tap "Change Status"
   - Select new status
   - Add seller notes
   - Verify status update

4. **Map View:**
   - Tap "Map" FAB
   - Verify all confirmed orders show on map
   - Tap markers
   - Verify order details display

5. **Route Planning:**
   - Tap "Plan Tour" FAB
   - Select multiple orders
   - Tap "Optimize Route"
   - Verify optimized route displays
   - Check turn-by-turn directions

## Troubleshooting

### Common Issues

**1. Login Fails with "Only sellers can use this app"**
- **Cause:** User account has `userType: 'buyer'`
- **Solution:** Use a seller account or register as seller via web app

**2. Map Doesn't Load**
- **Cause:** No internet connection or OpenStreetMap server issues
- **Solution:** Check internet connection, restart app

**3. Route Optimization Fails**
- **Cause:** OpenRouteService API key invalid or quota exceeded
- **Solution:** Check API key, verify quota limits

**4. Orders Don't Load**
- **Cause:** Backend API unreachable
- **Solution:** Verify API URL in constants, check backend deployment

**5. Icons Missing in Release Build**
- **Cause:** Tree shaking removes Material Icons
- **Solution:** Build with `--no-tree-shake-icons` flag

## Security Considerations

✅ **Implemented:**
- Secure token storage (FlutterSecureStorage)
- HTTPS API communication
- JWT expiration handling
- Seller-only access control

⚠️ **Best Practices:**
- Don't hardcode API keys in code
- Use environment variables for configuration
- Implement certificate pinning for production
- Add biometric authentication for sensitive operations

## Future Enhancements

🎯 **Planned Features:**
- Offline mode with local database
- Push notifications for new orders
- Real-time location tracking during delivery
- Photo proof of delivery
- Customer signature capture
- Multi-language support
- Dark mode

## Support

**Developer:** Yassine Dbaichi
**Project:** PFE - Geographic Information Science (SIG)
**Contact:** [Your Email/Phone]

---

*Last Updated: January 2025*
