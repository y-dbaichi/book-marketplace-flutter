// ==============================================================================
// USER DATA MODELS
// ==============================================================================
// Data models for representing user information in the seller app
// Handles serialization/deserialization for storage and API communication
//
// Models:
// - User: Main user entity with profile, location, and type information
// - UserProfile: User profile data (name, bio)
// - UserLocation: User's business/delivery location with coordinates
// - Coordinates: Geographic coordinates (latitude, longitude)
//
// User Types:
// - 'seller': Can list books, manage orders, deliver (Flutter app users)
// - 'buyer': Can browse books, place orders (Web app users only)
//
// Features:
// - Immutable data classes
// - JSON serialization and deserialization
// - Computed properties for display
// - Type-safe access to nested data
// ==============================================================================

// ==============================================================================
// USER MODEL
// ==============================================================================

/// Represents a user in the book marketplace
///
/// Contains all user information including:
/// - Basic info (id, email, user type)
/// - Contact info (phone)
/// - Profile data (name, bio)
/// - Location data (coordinates, address)
///
/// User Types:
/// - 'seller': Book sellers who fulfill orders (Flutter app users)
/// - 'buyer': Book buyers who place orders (Web app users)
///
/// IMPORTANT: Flutter app is exclusively for sellers
class User {
  /// Unique identifier for the user (MongoDB ObjectId)
  final String id;

  /// User's email address
  final String email;

  /// User type: 'seller' or 'buyer'
  ///
  /// IMPORTANT: Flutter app only allows 'seller' type
  /// Buyers must use the web application
  final String userType;

  /// Optional phone number for contact
  final String? phone;

  /// Optional user profile with name and bio
  final UserProfile? profile;

  /// Optional location (business address for sellers, delivery address for buyers)
  final UserLocation? location;

  /// Constructor
  User({
    required this.id,
    required this.email,
    required this.userType,
    this.phone,
    this.profile,
    this.location,
  });

  /// Create User from JSON response
  ///
  /// Handles both backend API format (uses '_id') and
  /// local storage format (uses 'id')
  ///
  /// Provides safe defaults:
  /// - Empty string for missing id
  /// - Empty string for missing email
  /// - 'buyer' for missing userType
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      userType: json['userType'] ?? 'buyer',
      phone: json['phone'],
      profile: json['profile'] != null
          ? UserProfile.fromJson(json['profile'])
          : null,
      location: json['location'] != null
          ? UserLocation.fromJson(json['location'])
          : null,
    );
  }

  /// Convert User to JSON for storage/transmission
  ///
  /// Serializes all user data including nested profile and location
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'userType': userType,
      'phone': phone,
      'profile': profile?.toJson(),
      'location': location?.toJson(),
    };
  }

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  /// Get user's display name
  ///
  /// Returns full name if profile exists with firstName and lastName
  /// Otherwise returns email address as fallback
  ///
  /// Example:
  /// - With profile: "Mohamed Hassan"
  /// - Without profile: "mohamed@example.com"
  String get displayName {
    if (profile?.firstName != null && profile?.lastName != null) {
      return '${profile!.firstName} ${profile!.lastName}';
    }
    return email;
  }
}

// ==============================================================================
// USER PROFILE MODEL
// ==============================================================================

/// Represents user profile information
///
/// Contains optional profile data that users can provide
/// in their account settings. All fields are optional as
/// users may not complete their profile.
class UserProfile {
  /// User's first name
  final String? firstName;

  /// User's last name
  final String? lastName;

  /// User's bio/description
  /// Example: "Librairie spécialisée en littérature française"
  final String? bio;

  /// Constructor
  UserProfile({
    this.firstName,
    this.lastName,
    this.bio,
  });

  /// Create UserProfile from JSON response
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      firstName: json['firstName'],
      lastName: json['lastName'],
      bio: json['bio'],
    );
  }

  /// Convert UserProfile to JSON for storage/transmission
  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'bio': bio,
    };
  }
}

// ==============================================================================
// USER LOCATION MODEL
// ==============================================================================

/// Represents a user's location
///
/// For sellers: Business location where they operate
/// For buyers: Delivery address preference
///
/// Contains:
/// - Coordinates for map display and routing
/// - Optional name for quick identification
/// - Optional address for human-readable display
class UserLocation {
  /// Optional location name
  /// Example: "Bookstore Downtown", "Home Address", "Office"
  final String? name;

  /// Geographic coordinates (latitude, longitude)
  final Coordinates? coordinates;

  /// Optional street address
  /// Example: "123 Rue Mohammed V, Casablanca 20000"
  final String? address;

  /// Constructor
  UserLocation({
    this.name,
    this.coordinates,
    this.address,
  });

  /// Create UserLocation from JSON response
  factory UserLocation.fromJson(Map<String, dynamic> json) {
    return UserLocation(
      name: json['name'],
      coordinates: json['coordinates'] != null
          ? Coordinates.fromJson(json['coordinates'])
          : null,
      address: json['address'],
    );
  }

  /// Convert UserLocation to JSON for storage/transmission
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'coordinates': coordinates?.toJson(),
      'address': address,
    };
  }
}

// ==============================================================================
// COORDINATES MODEL
// ==============================================================================

/// Represents geographic coordinates
///
/// Uses standard latitude/longitude format (not GeoJSON format)
/// - latitude: -90 to +90 (North-South position)
/// - longitude: -180 to +180 (East-West position)
///
/// Example (Casablanca, Morocco):
/// - latitude: 33.5731
/// - longitude: -7.5898
class Coordinates {
  /// Latitude coordinate (-90 to +90)
  /// Positive values are North, negative values are South
  final double latitude;

  /// Longitude coordinate (-180 to +180)
  /// Positive values are East, negative values are West
  final double longitude;

  /// Constructor
  Coordinates({
    required this.latitude,
    required this.longitude,
  });

  /// Create Coordinates from JSON response
  ///
  /// Provides safe default of (0.0, 0.0) for missing values
  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
    );
  }

  /// Convert Coordinates to JSON for storage/transmission
  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
