/// Application-wide constants
/// Contains API endpoints, storage keys, and default values
class AppConstants {
  // Private constructor to prevent instantiation
  AppConstants._();

  // ============================================
  // API CONFIGURATION
  // ============================================

  /// Base URL for API requests
  /// Production API (Vercel)
  static const String baseUrl = 'https://book-marketplace-api.vercel.app/api';

  /// Development API (uncomment for local testing)
  // static const String baseUrl = 'http://localhost:5001/api';
  // For Android Emulator: 'http://10.0.2.2:5001/api'
  // For Physical Device: 'http://YOUR_IP:5001/api'

  /// Auth endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String profileEndpoint = '/auth/me';
  static const String refreshEndpoint = '/auth/refresh';

  /// GeoJSON endpoints
  static const String geojsonExportsEndpoint = '/geojson/my-exports';
  static const String geojsonDownloadEndpoint = '/geojson/download';
  static const String geojsonGenerateEndpoint = '/geojson/generate';

  /// Orders endpoints
  static const String ordersEndpoint = '/orders';
  static const String sellerOrdersEndpoint = '/orders/my/seller';
  static const String buyerOrdersEndpoint = '/orders/my/buyer';

  // ============================================
  // SECURE STORAGE KEYS
  // ============================================

  static const String tokenKey = 'auth_token';
  static const String tokenExpiryKey = 'token_expiry';
  static const String userKey = 'user_data';
  static const String lastSyncKey = 'last_sync_timestamp';

  // ============================================
  // API SETTINGS
  // ============================================

  /// API timeout in seconds
  static const int apiTimeout = 30;

  /// Enable detailed API logging (disable in production)
  static const bool enableApiLogging = false;

  // ============================================
  // MAP DEFAULTS (Casablanca, Morocco)
  // ============================================

  static const double defaultLatitude = 33.5731;
  static const double defaultLongitude = -7.5898;
  static const double defaultZoom = 12.0;

  // ============================================
  // ORDER STATUS VALUES
  // ============================================

  static const String orderStatusPending = 'pending';
  static const String orderStatusConfirmed = 'confirmed';
  static const String orderStatusDelivered = 'delivered';
  static const String orderStatusRefused = 'refused';

  // ============================================
  // UI CONSTANTS
  // ============================================

  /// Duration for snackbar messages
  static const Duration snackbarDuration = Duration(seconds: 3);

  /// Duration for loading indicators
  static const Duration loadingDelay = Duration(milliseconds: 300);

  /// Refresh interval for order polling (30 seconds)
  static const Duration orderRefreshInterval = Duration(seconds: 30);
}
