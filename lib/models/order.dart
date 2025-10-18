// ==============================================================================
// ORDER DATA MODELS
// ==============================================================================
// Data models for representing orders and related entities in the seller app
// Handles deserialization from backend API responses
//
// Models:
// - Order: Main order entity with buyer, book, location, and status information
// - OrderBook: Book information within an order
// - OrderUser: Buyer information within an order
// - UserProfile: User profile data (name, bio)
// - OrderLocation: Geographic location data with coordinates
//
// Order Status Flow:
// pending → confirmed → delivered
//         ↘ refused
//
// Features:
// - Immutable data classes
// - JSON deserialization
// - Computed properties for display
// - French status translations
// - Type-safe access to nested data
// ==============================================================================

// ==============================================================================
// ORDER MODEL
// ==============================================================================

/// Represents a book order in the marketplace
///
/// An order contains all information about a buyer's purchase:
/// - Book details (title, author, price)
/// - Buyer information (name, email, phone, location)
/// - Order details (quantity, total price, status, notes)
/// - Timestamps (created at, updated at)
///
/// Status values:
/// - 'pending': Newly created order waiting for seller confirmation
/// - 'confirmed': Seller accepted order and will prepare delivery
/// - 'delivered': Order successfully delivered to buyer
/// - 'refused': Seller refused order (out of stock, unavailable, etc.)
class Order {
  /// Unique identifier for the order (MongoDB ObjectId)
  final String id;

  /// Book being ordered
  final OrderBook book;

  /// Buyer who placed the order
  final OrderUser buyer;

  /// Number of copies ordered
  final int quantity;

  /// Total price for the order (book price × quantity)
  final double totalPrice;

  /// Current status of the order
  /// Values: 'pending', 'confirmed', 'delivered', 'refused'
  final String status;

  /// Optional delivery location provided by buyer
  /// Used by seller for navigation and delivery routing
  final OrderLocation? buyerLocation;

  /// Optional notes from the buyer
  /// Example: "Deliver between 2-5pm", "Call before delivery"
  final String? buyerNotes;

  /// Optional notes from the seller
  /// Example: "Delivered at door", "Customer not home - rescheduled"
  final String? sellerNotes;

  /// When the order was created
  final DateTime createdAt;

  /// When the order was last updated
  final DateTime updatedAt;

  /// Constructor
  Order({
    required this.id,
    required this.book,
    required this.buyer,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    this.buyerLocation,
    this.buyerNotes,
    this.sellerNotes,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create Order from JSON response
  ///
  /// Deserializes order data from backend API responses
  /// Handles nested objects (book, buyer, location)
  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] as String,
      book: OrderBook.fromJson(json['book'] as Map<String, dynamic>),
      buyer: OrderUser.fromJson(json['buyer'] as Map<String, dynamic>),
      quantity: json['quantity'] as int,
      totalPrice: (json['totalPrice'] as num).toDouble(),
      status: json['status'] as String,
      buyerLocation: json['buyerLocation'] != null
          ? OrderLocation.fromJson(json['buyerLocation'] as Map<String, dynamic>)
          : null,
      buyerNotes: json['buyerNotes'] as String?,
      sellerNotes: json['sellerNotes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  // ===========================================================================
  // STATUS HELPERS
  // ===========================================================================

  /// Check if order is confirmed
  bool get isConfirmed => status == 'confirmed';

  /// Check if order is delivered
  bool get isDelivered => status == 'delivered';

  /// Check if order is pending
  bool get isPending => status == 'pending';

  /// Check if order is refused
  bool get isRefused => status == 'refused';

  /// Get French display text for status
  ///
  /// Returns user-friendly status in French:
  /// - pending → "En attente"
  /// - confirmed → "Confirmée"
  /// - delivered → "Livrée"
  /// - refused → "Refusée"
  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'delivered':
        return 'Livrée';
      case 'refused':
        return 'Refusée';
      default:
        return status;
    }
  }

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  /// Get buyer's full name or email
  ///
  /// Returns full name if profile exists with firstName and lastName
  /// Otherwise returns email address as fallback
  String get buyerName {
    if (buyer.profile?.firstName != null && buyer.profile?.lastName != null) {
      return '${buyer.profile!.firstName} ${buyer.profile!.lastName}';
    }
    return buyer.email;
  }
}

// ==============================================================================
// ORDER BOOK MODEL
// ==============================================================================

/// Represents book information within an order
///
/// Contains essential book details needed for order display
/// and confirmation. This is a simplified version of the full
/// book model, containing only order-relevant data.
class OrderBook {
  /// Unique identifier for the book (MongoDB ObjectId)
  final String id;

  /// Book title
  final String title;

  /// Book author name
  final String author;

  /// Unit price of the book
  /// Optional because historical orders might not have price recorded
  final double? price;

  /// Constructor
  OrderBook({
    required this.id,
    required this.title,
    required this.author,
    this.price,
  });

  /// Create OrderBook from JSON response
  factory OrderBook.fromJson(Map<String, dynamic> json) {
    return OrderBook(
      id: json['_id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
    );
  }
}

// ==============================================================================
// ORDER USER MODEL
// ==============================================================================

/// Represents buyer information within an order
///
/// Contains essential buyer details needed for order fulfillment
/// and contact. This is a simplified version of the full user model,
/// containing only order-relevant data.
class OrderUser {
  /// Unique identifier for the user (MongoDB ObjectId)
  final String id;

  /// User's email address
  final String email;

  /// Optional phone number for contact
  final String? phone;

  /// Optional user profile with name and bio
  final UserProfile? profile;

  /// Constructor
  OrderUser({
    required this.id,
    required this.email,
    this.phone,
    this.profile,
  });

  /// Create OrderUser from JSON response
  factory OrderUser.fromJson(Map<String, dynamic> json) {
    return OrderUser(
      id: json['_id'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      profile: json['profile'] != null
          ? UserProfile.fromJson(json['profile'] as Map<String, dynamic>)
          : null,
    );
  }
}

// ==============================================================================
// USER PROFILE MODEL
// ==============================================================================

/// Represents user profile information
///
/// Contains optional profile data like name that users can
/// provide in their account settings.
class UserProfile {
  /// User's first name
  final String? firstName;

  /// User's last name
  final String? lastName;

  /// Constructor
  UserProfile({
    this.firstName,
    this.lastName,
  });

  /// Create UserProfile from JSON response
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
    );
  }
}

// ==============================================================================
// ORDER LOCATION MODEL
// ==============================================================================

/// Represents a geographic location for order delivery
///
/// Contains coordinates in GeoJSON format [longitude, latitude]
/// along with optional name and address for display.
///
/// Used by sellers to:
/// - View buyer delivery location on map
/// - Navigate to delivery address
/// - Plan delivery routes
class OrderLocation {
  /// Geographic coordinates in GeoJSON format: [longitude, latitude]
  ///
  /// IMPORTANT: GeoJSON uses [longitude, latitude] order, not [latitude, longitude]
  /// - coordinates[0] = longitude
  /// - coordinates[1] = latitude
  final List<double> coordinates;

  /// Optional location name
  /// Example: "Home", "Office", "Apartment Building"
  final String? name;

  /// Optional street address
  /// Example: "123 Rue de la Paix, Casablanca 20000"
  final String? address;

  /// Constructor
  OrderLocation({
    required this.coordinates,
    this.name,
    this.address,
  });

  /// Create OrderLocation from JSON response
  factory OrderLocation.fromJson(Map<String, dynamic> json) {
    return OrderLocation(
      coordinates: (json['coordinates'] as List<dynamic>)
          .map((e) => (e as num).toDouble())
          .toList(),
      name: json['name'] as String?,
      address: json['address'] as String?,
    );
  }

  // ===========================================================================
  // COORDINATE HELPERS
  // ===========================================================================

  /// Get longitude (first coordinate)
  ///
  /// GeoJSON format uses [longitude, latitude] order
  double get longitude => coordinates[0];

  /// Get latitude (second coordinate)
  ///
  /// GeoJSON format uses [longitude, latitude] order
  double get latitude => coordinates[1];
}
