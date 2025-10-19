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
  // OPENROUTESERVICE API CONFIGURATION
  // ============================================

  /// OpenRouteService API key
  /// Free API key - get your own at: https://openrouteservice.org/dev/#/signup
  static const String openRouteServiceApiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBmYmNiMTA0ZjlhODQ4YjZiNWVmNWJjM2FiODZmZTU0IiwiaCI6Im11cm11cjY0In0=';

  /// OpenRouteService base URL
  static const String openRouteServiceBaseUrl = 'https://api.openrouteservice.org/v2';

  /// Enable mock routing data (for testing without API)
  static const bool useMockRouting = false;

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

  /// Duration for error snackbar messages (longer for reading)
  static const Duration snackbarErrorDuration = Duration(seconds: 4);

  /// Duration for loading indicators
  static const Duration loadingDelay = Duration(milliseconds: 300);

  /// Duration for splash screen
  static const Duration splashDuration = Duration(milliseconds: 1500);

  /// Refresh interval for order polling (30 seconds)
  static const Duration orderRefreshInterval = Duration(seconds: 30);

  // ============================================
  // SPACING CONSTANTS
  // ============================================

  /// Micro spacing (4px) - Use for very tight spacing
  static const double spacingMicro = 4.0;

  /// Tiny spacing (8px) - Use for minimal gaps
  static const double spacingTiny = 8.0;

  /// Small spacing (12px) - Use for compact layouts
  static const double spacingSmall = 12.0;

  /// Medium spacing (16px) - Default spacing for most elements
  static const double spacingMedium = 16.0;

  /// Large spacing (20px) - Use for generous spacing
  static const double spacingLarge = 20.0;

  /// Extra large spacing (24px) - Use for major sections
  static const double spacingExtraLarge = 24.0;

  /// Huge spacing (32px) - Use for page-level separation
  static const double spacingHuge = 32.0;

  /// Massive spacing (48px) - Use for dramatic separation
  static const double spacingMassive = 48.0;

  // ============================================
  // FONT SIZE CONSTANTS
  // ============================================

  /// Tiny font size (11px) - Use for badges, micro labels
  static const double fontSizeTiny = 11.0;

  /// Small font size (12px) - Use for captions, secondary text
  static const double fontSizeSmall = 12.0;

  /// Medium-small font size (13px) - Use for compact body text
  static const double fontSizeMediumSmall = 13.0;

  /// Medium font size (14px) - Use for regular body text
  static const double fontSizeMedium = 14.0;

  /// Medium-large font size (16px) - Use for emphasis, buttons
  static const double fontSizeMediumLarge = 16.0;

  /// Large font size (18px) - Use for card titles
  static const double fontSizeLarge = 18.0;

  /// Extra large font size (20px) - Use for page titles
  static const double fontSizeExtraLarge = 20.0;

  /// Huge font size (32px) - Use for hero text, splash screens
  static const double fontSizeHuge = 32.0;

  // ============================================
  // ICON SIZE CONSTANTS
  // ============================================

  /// Tiny icon size (14px) - Use for inline icons in text
  static const double iconSizeTiny = 14.0;

  /// Small icon size (16px) - Use for compact UI elements
  static const double iconSizeSmall = 16.0;

  /// Medium icon size (20px) - Use for standard buttons
  static const double iconSizeMedium = 20.0;

  /// Large icon size (24px) - Use for prominent buttons
  static const double iconSizeLarge = 24.0;

  /// Extra large icon size (28px) - Use for map markers
  static const double iconSizeExtraLarge = 28.0;

  /// Huge icon size (48px) - Use for empty states
  static const double iconSizeHuge = 48.0;

  /// Massive icon size (80px) - Use for splash screen, app logo
  static const double iconSizeMassive = 80.0;

  // ============================================
  // BORDER RADIUS CONSTANTS
  // ============================================

  /// Small border radius (8px) - Use for buttons, chips
  static const double borderRadiusSmall = 8.0;

  /// Medium border radius (12px) - Default for cards, containers
  static const double borderRadiusMedium = 12.0;

  /// Large border radius (16px) - Use for prominent cards
  static const double borderRadiusLarge = 16.0;

  /// Extra large border radius (20px) - Use for bottom sheets
  static const double borderRadiusExtraLarge = 20.0;

  /// Huge border radius (24px) - Use for special elements
  static const double borderRadiusHuge = 24.0;

  // ============================================
  // OPACITY CONSTANTS
  // ============================================

  /// Very subtle opacity (0.05) - Use for very light overlays
  static const double opacityVerySubtle = 0.05;

  /// Subtle opacity (0.1) - Use for light backgrounds
  static const double opacitySubtle = 0.1;

  /// Light opacity (0.2) - Use for disabled states
  static const double opacityLight = 0.2;

  /// Medium opacity (0.3) - Use for shadows, overlays
  static const double opacityMedium = 0.3;

  /// Strong opacity (0.8) - Use for visible but translucent elements
  static const double opacityStrong = 0.8;

  /// Very strong opacity (0.9) - Use for mostly opaque elements
  static const double opacityVeryStrong = 0.9;

  // ============================================
  // SIZE CONSTANTS
  // ============================================

  /// Standard marker/icon container size (50px)
  static const double markerSize = 50.0;

  /// Small loading indicator size (16px)
  static const double loadingIndicatorSmall = 16.0;

  /// Medium loading indicator size (20px)
  static const double loadingIndicatorMedium = 20.0;

  // ============================================
  // VISUAL EFFECT CONSTANTS
  // ============================================

  /// Small blur radius (4px) - Use for subtle shadows
  static const double blurRadiusSmall = 4.0;

  /// Medium blur radius (8px) - Use for card shadows
  static const double blurRadiusMedium = 8.0;

  /// Thin stroke width (2px) - Use for borders, outlines
  static const double strokeWidthThin = 2.0;

  /// Medium stroke width (3px) - Use for emphasized borders
  static const double strokeWidthMedium = 3.0;

  /// Thick stroke width (4px) - Use for map routes
  static const double strokeWidthThick = 4.0;

  /// Divider height (1px) - Use for horizontal dividers
  static const double dividerHeight = 1.0;

  /// Elevation value for cards
  static const double elevationCard = 2.0;

  // ============================================
  // MAP CONSTANTS
  // ============================================

  /// Fallback speed for route duration calculation (km/h)
  static const double fallbackSpeedKmh = 40.0;

  /// Selected location zoom level
  static const double selectedLocationZoom = 14.0;

  /// Map bounds padding (50px)
  static const double mapBoundsPadding = 50.0;
}
