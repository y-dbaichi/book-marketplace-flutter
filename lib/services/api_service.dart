// ==============================================================================
// API SERVICE
// ==============================================================================
// Singleton service for making HTTP API requests with automatic auth handling
// Built on top of Dio HTTP client with intelligent interceptors
//
// Features:
// - Automatic JWT token injection in request headers
// - Automatic token refresh before expiry
// - 401 error handling with token refresh and retry
// - Request/response logging for debugging
// - Timeout configuration
// - Singleton pattern for consistent state
//
// Token Refresh Strategy:
// - Proactive: Refreshes token before expiry (checked before each request)
// - Reactive: Refreshes token on 401 errors and retries the original request
// - Prevents multiple simultaneous refresh requests with _isRefreshing flag
//
// Security:
// - Tokens stored in encrypted secure storage
// - Bearer token authentication
// - Automatic cleanup on auth failure
// ==============================================================================

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';

// ==============================================================================
// API SERVICE CLASS
// ==============================================================================

/// Service for making HTTP API requests with automatic authentication
///
/// Implements the Singleton pattern to ensure consistent Dio configuration
/// and token refresh state across the application. Handles all HTTP operations
/// (GET, POST, PUT, DELETE) with automatic JWT token management.
///
/// Architecture:
/// - Uses Dio interceptors for request/response/error handling
/// - Separate Dio instance for token refresh to avoid interceptor loops
/// - Proactive token refresh (before requests) + Reactive refresh (on 401)
///
/// Usage:
/// ```dart
/// final api = ApiService();
/// final response = await api.get('/endpoint');
/// final postResponse = await api.post('/endpoint', data: {'key': 'value'});
/// ```
class ApiService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================

  /// Private static instance for singleton pattern
  static final ApiService _instance = ApiService._internal();

  /// Dio HTTP client instance
  late Dio _dio;

  /// Secure storage service for token management
  final SecureStorageService _storage = SecureStorageService();

  /// Flag to prevent multiple simultaneous token refresh requests
  /// Critical for avoiding race conditions when multiple requests fail with 401
  bool _isRefreshing = false;

  /// Callbacks waiting for token refresh to complete
  /// Not currently used but reserved for future queue implementation
  final List<Function> _refreshCallbacks = [];

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /// Private constructor for singleton pattern
  ///
  /// Initializes Dio with base configuration and sets up interceptors
  ApiService._internal() {
    // Initialize Dio with base configuration
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: Duration(seconds: AppConstants.apiTimeout),
        receiveTimeout: Duration(seconds: AppConstants.apiTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add authentication and error handling interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        // ===========================================================================
        // REQUEST INTERCEPTOR
        // ===========================================================================
        /// Called before each request is sent
        ///
        /// Responsibilities:
        /// 1. Check if token needs proactive refresh (expires soon)
        /// 2. Inject Bearer token into Authorization header
        /// 3. Log the outgoing request
        onRequest: (options, handler) async {
          // PROACTIVE TOKEN REFRESH
          // Check if token expires within 24 hours and refresh if needed
          if (await _storage.shouldRefreshToken() && !_isRefreshing) {
            debugPrint('⏰ Token about to expire, proactively refreshing...');
            await _refreshToken();
          }

          // INJECT AUTH TOKEN
          // Add JWT token to request headers if available
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // LOG REQUEST
          debugPrint('🌐 ${options.method} ${options.path}');

          // Continue with the request
          return handler.next(options);
        },

        // ===========================================================================
        // RESPONSE INTERCEPTOR
        // ===========================================================================
        /// Called when response is received successfully
        ///
        /// Logs the response status for debugging
        onResponse: (response, handler) {
          debugPrint('✅ ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },

        // ===========================================================================
        // ERROR INTERCEPTOR
        // ===========================================================================
        /// Called when request fails
        ///
        /// Handles 401 Unauthorized errors with automatic token refresh and retry
        /// This is REACTIVE token refresh (after 401 error)
        onError: (error, handler) async {
          debugPrint(
            '❌ ${error.response?.statusCode} ${error.requestOptions.path}',
          );

          // HANDLE 401 UNAUTHORIZED - Token expired or invalid
          if (error.response?.statusCode == 401 && !_isRefreshing) {
            debugPrint('🔄 401 Error - Attempting reactive token refresh...');

            // Try to refresh the token
            final refreshed = await _refreshToken();

            if (refreshed) {
              // SUCCESS: Token refreshed, retry the original request
              debugPrint('♻️ Retrying original request with refreshed token');

              final token = await _storage.getToken();
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer $token';

              try {
                // Retry the original request with new token
                final response = await _dio.fetch(options);
                return handler.resolve(response);
              } catch (e) {
                // Retry failed, pass error to caller
                return handler.next(error);
              }
            } else {
              // FAILURE: Token refresh failed, logout user
              debugPrint('❌ Token refresh failed, clearing auth data');
              await _storage.clearAll();
            }
          }

          // Pass error to caller (not a 401, or refresh failed)
          return handler.next(error);
        },
      ),
    );

    // Add pretty logging interceptor in debug mode
    if (AppConstants.enableApiLogging) {
      _dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
        ),
      );
    }
  }

  /// Factory constructor returns the singleton instance
  factory ApiService() => _instance;

  // ===========================================================================
  // TOKEN REFRESH LOGIC
  // ===========================================================================

  /// Refresh authentication token
  ///
  /// This is the core token refresh logic used by both:
  /// - Proactive refresh (before token expires)
  /// - Reactive refresh (after 401 error)
  ///
  /// Strategy:
  /// 1. Uses separate Dio instance to avoid interceptor loops
  /// 2. Uses _isRefreshing flag to prevent concurrent refresh requests
  /// 3. Updates token in secure storage on success
  ///
  /// Returns:
  /// - true if token refreshed successfully
  /// - false if no token available or refresh failed
  Future<bool> _refreshToken() async {
    // Prevent concurrent refresh requests
    if (_isRefreshing) {
      debugPrint('⏳ Already refreshing token, waiting...');
      return false;
    }

    _isRefreshing = true;

    try {
      debugPrint('🔄 Refreshing token...');

      // Get current token
      final token = await _storage.getToken();
      if (token == null) {
        debugPrint('❌ No token to refresh');
        _isRefreshing = false;
        return false;
      }

      // IMPORTANT: Create separate Dio instance for refresh
      // Using main _dio would trigger interceptors and cause infinite loop
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: AppConstants.baseUrl,
          connectTimeout: Duration(seconds: AppConstants.apiTimeout),
          receiveTimeout: Duration(seconds: AppConstants.apiTimeout),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ),
      );

      // Send refresh request to backend
      final response = await refreshDio.post(AppConstants.refreshEndpoint);

      if (response.statusCode == 200) {
        // SUCCESS: Extract and save new token
        final newToken = response.data['token'];
        await _storage.saveToken(newToken);

        debugPrint('✅ Token refreshed successfully');
        _isRefreshing = false;
        return true;
      } else {
        // FAILURE: Unexpected status code
        debugPrint('❌ Token refresh failed: ${response.statusCode}');
        _isRefreshing = false;
        return false;
      }
    } catch (e) {
      // FAILURE: Network error or backend error
      debugPrint('❌ Token refresh error: $e');
      _isRefreshing = false;
      return false;
    }
  }

  // ===========================================================================
  // HTTP METHODS
  // ===========================================================================

  /// Perform GET request
  ///
  /// Parameters:
  /// - [path]: API endpoint path (will be appended to baseUrl)
  /// - [queryParameters]: Optional URL query parameters
  ///
  /// Returns:
  /// - Dio Response object containing response data and metadata
  ///
  /// Throws:
  /// - DioException on network errors or HTTP errors
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  /// Perform POST request
  ///
  /// Parameters:
  /// - [path]: API endpoint path (will be appended to baseUrl)
  /// - [data]: Optional request body data (will be JSON encoded)
  ///
  /// Returns:
  /// - Dio Response object containing response data and metadata
  ///
  /// Throws:
  /// - DioException on network errors or HTTP errors
  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  /// Perform PUT request
  ///
  /// Parameters:
  /// - [path]: API endpoint path (will be appended to baseUrl)
  /// - [data]: Optional request body data (will be JSON encoded)
  ///
  /// Returns:
  /// - Dio Response object containing response data and metadata
  ///
  /// Throws:
  /// - DioException on network errors or HTTP errors
  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  /// Perform DELETE request
  ///
  /// Parameters:
  /// - [path]: API endpoint path (will be appended to baseUrl)
  ///
  /// Returns:
  /// - Dio Response object containing response data and metadata
  ///
  /// Throws:
  /// - DioException on network errors or HTTP errors
  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }
}
