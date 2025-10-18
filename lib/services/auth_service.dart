// ==============================================================================
// AUTHENTICATION SERVICE
// ==============================================================================
// Singleton service for managing user authentication and authorization
// Handles login, logout, token management, and user session persistence
//
// Features:
// - User authentication (login/logout)
// - JWT token management with automatic refresh
// - Seller-only access control (Flutter app restricted to sellers)
// - User session persistence using secure storage
// - Token validity checking and expiry management
//
// Security:
// - Tokens stored in encrypted secure storage
// - Automatic token refresh before expiry
// - Role-based access control (sellers only)
// - Secure logout with complete data cleanup
// ==============================================================================

import 'package:flutter/foundation.dart';
import '../models/auth_response.dart';
import '../models/user.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';
import 'api_service.dart';

// ==============================================================================
// AUTHENTICATION SERVICE CLASS
// ==============================================================================

/// Service for managing user authentication and authorization
///
/// Implements the Singleton pattern to ensure only one instance exists
/// throughout the application lifecycle. Manages all authentication-related
/// operations including login, logout, token management, and user sessions.
///
/// Usage:
/// ```dart
/// final authService = AuthService();
/// final authResponse = await authService.login('email@example.com', 'password');
/// final isLoggedIn = await authService.isLoggedIn();
/// await authService.logout();
/// ```
class AuthService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================

  /// Private static instance for singleton pattern
  static final AuthService _instance = AuthService._internal();

  /// API service for making HTTP requests
  final ApiService _api = ApiService();

  /// Secure storage service for persisting auth data
  final SecureStorageService _storage = SecureStorageService();

  /// Private constructor for singleton pattern
  AuthService._internal();

  /// Factory constructor returns the singleton instance
  factory AuthService() => _instance;

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /// Currently authenticated user (null if not logged in)
  User? _currentUser;

  /// Get the currently authenticated user
  User? get currentUser => _currentUser;

  // ===========================================================================
  // AUTHENTICATION METHODS
  // ===========================================================================

  /// Authenticate user with email and password
  ///
  /// This method:
  /// 1. Sends login credentials to backend
  /// 2. Validates user is a seller (Flutter app is sellers-only)
  /// 3. Saves JWT token and user data to secure storage
  /// 4. Updates current user state
  ///
  /// Parameters:
  /// - [email]: User's email address
  /// - [password]: User's password
  ///
  /// Returns:
  /// - [AuthResponse] containing token and user data
  ///
  /// Throws:
  /// - Exception with user-friendly French error messages
  /// - Specific exceptions for: wrong credentials, network errors, seller check
  Future<AuthResponse> login(String email, String password) async {
    try {
      debugPrint('🔐 Attempting login for: $email');

      // Prepare login request
      final request = LoginRequest(email: email, password: password);

      // Send login request to backend
      final response = await _api.post(
        AppConstants.loginEndpoint,
        data: request.toJson(),
      );

      // Parse authentication response
      final authResponse = AuthResponse.fromJson(response.data);

      // IMPORTANT: Check if user is a seller
      // Flutter app is exclusively for sellers - buyers use web app
      if (authResponse.user.userType != 'seller') {
        debugPrint(
          '❌ Login rejected: User is not a seller (type: ${authResponse.user.userType})',
        );
        throw Exception(
          'Cette application est réservée aux vendeurs uniquement. '
          'Veuillez utiliser la version web pour les acheteurs.',
        );
      }

      // Save authentication data to secure storage
      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user.toJson());

      // Update current user state
      _currentUser = authResponse.user;

      debugPrint('✅ Login successful: ${authResponse.user.email} (seller)');
      return authResponse;
    } catch (e) {
      debugPrint('❌ Login error: $e');

      // Handle Dio network exceptions with user-friendly French messages
      if (e.toString().contains('DioException')) {
        // 401/400: Invalid credentials
        if (e.toString().contains('401') || e.toString().contains('400')) {
          throw Exception('Email ou mot de passe incorrect');
        }
        // 404: Service unavailable
        else if (e.toString().contains('404')) {
          throw Exception('Service de connexion indisponible');
        }
        // 500: Server error
        else if (e.toString().contains('500')) {
          throw Exception('Erreur du serveur. Veuillez réessayer plus tard');
        }
        // Network connectivity issues
        else if (e.toString().contains('SocketException') ||
            e.toString().contains('Connection')) {
          throw Exception('Pas de connexion internet. Vérifiez votre réseau');
        }
        // Generic network error
        throw Exception('Erreur de connexion. Vérifiez votre connexion internet');
      }

      // Re-throw if it's already a formatted exception (like seller check)
      rethrow;
    }
  }

  /// Log out the current user
  ///
  /// This method:
  /// 1. Clears all data from secure storage (token, user data, expiry)
  /// 2. Resets current user state to null
  /// 3. Logs the operation
  ///
  /// This is a secure logout that removes all traces of authentication
  Future<void> logout() async {
    await _storage.clearAll();
    _currentUser = null;
    debugPrint('✅ Logout successful');
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /// Load user data from secure storage
  ///
  /// This method:
  /// 1. Checks if auth token exists
  /// 2. Loads user data from secure storage
  /// 3. Validates user is a seller (auto-logout if not)
  /// 4. Updates current user state
  ///
  /// Returns:
  /// - true if user loaded successfully
  /// - false if no token, no user data, or not a seller
  Future<bool> loadUser() async {
    // Check if auth token exists
    final hasToken = await _storage.hasToken();
    if (!hasToken) return false;

    // Load user data from storage
    final userData = await _storage.getUser();
    if (userData != null) {
      final user = User.fromJson(userData);

      // Verify user is a seller (security check)
      // Flutter app is exclusively for sellers
      if (user.userType != 'seller') {
        debugPrint('❌ Auto-logout: User is not a seller (type: ${user.userType})');
        await logout();
        return false;
      }

      // Update current user state
      _currentUser = user;
      return true;
    }

    return false;
  }

  /// Check if user is currently logged in
  ///
  /// First checks in-memory state, then attempts to load from storage
  ///
  /// Returns:
  /// - true if user is authenticated
  /// - false otherwise
  Future<bool> isLoggedIn() async {
    // Quick check: if user already loaded in memory
    if (_currentUser != null) return true;

    // Fallback: try to load from secure storage
    return await loadUser();
  }

  // ===========================================================================
  // TOKEN MANAGEMENT
  // ===========================================================================

  /// Manually refresh the authentication token
  ///
  /// This method:
  /// 1. Sends refresh request to backend with current token
  /// 2. Validates refreshed user is still a seller
  /// 3. Saves new token and user data
  /// 4. Updates current user state
  ///
  /// Returns:
  /// - true if token refreshed successfully
  /// - false if refresh failed or user no longer a seller
  ///
  /// Note: Automatic token refresh is handled by ApiService interceptor
  /// This method is for manual refresh operations
  Future<bool> refreshToken() async {
    try {
      debugPrint('🔄 Manually refreshing auth token...');

      // Send refresh request to backend
      final response = await _api.post(AppConstants.refreshEndpoint);
      final authResponse = AuthResponse.fromJson(response.data);

      // IMPORTANT: Verify user is still a seller after refresh
      if (authResponse.user.userType != 'seller') {
        debugPrint('❌ Token refresh rejected: User is not a seller');
        await logout();
        return false;
      }

      // Save new token and user data
      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user.toJson());
      _currentUser = authResponse.user;

      debugPrint('✅ Token refresh successful');
      return true;
    } catch (e) {
      debugPrint('❌ Token refresh failed: $e');
      return false;
    }
  }

  /// Check token validity and refresh if necessary
  ///
  /// This method performs a complete token health check:
  /// 1. Checks if token is expired (logout if expired)
  /// 2. Checks if token needs refresh (expires within 24 hours)
  /// 3. Attempts automatic refresh if needed
  ///
  /// Returns:
  /// - true if token is valid or successfully refreshed
  /// - false if token is expired or refresh failed
  ///
  /// This method is called during app initialization to ensure
  /// the user session is valid before navigating to protected screens
  Future<bool> checkTokenValidity() async {
    try {
      // Check if token is already expired
      if (await _storage.isTokenExpired()) {
        debugPrint('⚠️ Token is expired, logging out');
        await logout();
        return false;
      }

      // Check if token needs refresh (expires within 24 hours)
      if (await _storage.shouldRefreshToken()) {
        debugPrint('⏰ Token needs refresh (expires soon)');
        return await refreshToken();
      }

      // Token is valid and doesn't need refresh
      return true;
    } catch (e) {
      debugPrint('❌ Token validity check failed: $e');
      return false;
    }
  }
}

// ==============================================================================
// LOGIN REQUEST MODEL
// ==============================================================================

/// Model for login request payload
///
/// Simple data class to structure login credentials
class LoginRequest {
  /// User's email address
  final String email;

  /// User's password
  final String password;

  /// Constructor
  LoginRequest({
    required this.email,
    required this.password,
  });

  /// Convert to JSON for API request
  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}
