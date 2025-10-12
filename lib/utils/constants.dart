class AppConstants {
  // For Mac/iOS Simulator - use localhost
  // For Android Emulator - use 10.0.2.2
  // For Physical Device - use your Mac's IP (find with: ifconfig | grep "inet " | grep -v 127.0.0.1)
  static const String baseUrl = 'http://localhost:5001/api';
  
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String profileEndpoint = '/auth/me';
  static const String geojsonExportsEndpoint = '/geojson/my-exports';
  static const String geojsonDownloadEndpoint = '/geojson/download';
  static const String geojsonGenerateEndpoint = '/geojson/generate';
  
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String lastSyncKey = 'last_sync_timestamp';
  
  static const int apiTimeout = 30;
  static const bool enableApiLogging = true;
  
  static const double defaultLatitude = 33.5731;
  static const double defaultLongitude = -7.5898;
  static const double defaultZoom = 12.0;
}
