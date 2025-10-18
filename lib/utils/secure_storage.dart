// ==============================================================================
// SECURE STORAGE SERVICE
// ==============================================================================
// Singleton service for secure storage operations using FlutterSecureStorage
// Provides encrypted storage for sensitive data like authentication tokens
//
// Features:
// - Encrypted storage for Android (encrypted shared preferences)
// - Keychain storage for iOS
// - Token expiry management
// - User data persistence
// - Automatic cleanup
//
// Security:
// - All data is encrypted at rest
// - Uses platform-specific secure storage (Keychain on iOS, EncryptedSharedPreferences on Android)
// - Tokens expire after 7 days (matching backend JWT expiry)
// ==============================================================================

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'constants.dart';

/// Secure storage service for managing sensitive data
///
/// Implements the Singleton pattern to ensure only one instance exists
/// throughout the application lifecycle.
///
/// Usage:
/// ```dart
/// final storage = SecureStorageService();
/// await storage.saveToken('jwt_token_here');
/// final token = await storage.getToken();
/// ```
class SecureStorageService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================

  /// Private static instance
  static final SecureStorageService _instance =
      SecureStorageService._internal();

  /// Flutter secure storage instance
  late final FlutterSecureStorage _storage;

  /// Private constructor for singleton pattern
  SecureStorageService._internal() {
    _storage = const FlutterSecureStorage(
      // Android-specific options
      aOptions: AndroidOptions(
        encryptedSharedPreferences: true,
      ),
      // iOS-specific options
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock,
      ),
    );
  }

  /// Factory constructor returns the singleton instance
  factory SecureStorageService() => _instance;

  // ===========================================================================
  // TOKEN MANAGEMENT
  // ===========================================================================

  /// Save authentication token to secure storage
  ///
  /// Also saves token expiry date (7 days from now, matching backend JWT expiry)
  ///
  /// Parameters:
  /// - [token]: The JWT token to store
  ///
  /// Throws:
  /// - Exception if storage operation fails
  Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: AppConstants.tokenKey, value: token);

      // Calculate and save token expiry (7 days from now)
      final expiryDate = DateTime.now().add(const Duration(days: 7));
      await _storage.write(
        key: AppConstants.tokenExpiryKey,
        value: expiryDate.toIso8601String(),
      );

      debugPrint('🔐 Token saved successfully (expires: $expiryDate)');
    } catch (error, stackTrace) {
      debugPrint('❌ Error saving token: $error');
      debugPrint('Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Retrieve authentication token from secure storage
  ///
  /// Returns:
  /// - The stored JWT token, or null if no token exists
  Future<String?> getToken() async {
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);

      if (token != null) {
        debugPrint('🔐 Token retrieved successfully');
      } else {
        debugPrint('🔐 No token found in storage');
      }

      return token;
    } catch (error, stackTrace) {
      debugPrint('❌ Error retrieving token: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  /// Delete authentication token and expiry from secure storage
  ///
  /// Used during logout or when token needs to be invalidated
  Future<void> deleteToken() async {
    try {
      await _storage.delete(key: AppConstants.tokenKey);
      await _storage.delete(key: AppConstants.tokenExpiryKey);
      debugPrint('🔐 Token deleted successfully');
    } catch (error, stackTrace) {
      debugPrint('❌ Error deleting token: $error');
      debugPrint('Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Check if a valid token exists in storage
  ///
  /// Returns:
  /// - true if a non-empty token exists, false otherwise
  Future<bool> hasToken() async {
    try {
      final token = await getToken();
      return token != null && token.isNotEmpty;
    } catch (error) {
      debugPrint('❌ Error checking token existence: $error');
      return false;
    }
  }

  // ===========================================================================
  // TOKEN EXPIRY MANAGEMENT
  // ===========================================================================

  /// Get the token expiry date
  ///
  /// Returns:
  /// - DateTime of token expiry, or null if not found
  Future<DateTime?> getTokenExpiry() async {
    try {
      final expiryString = await _storage.read(key: AppConstants.tokenExpiryKey);

      if (expiryString != null && expiryString.isNotEmpty) {
        return DateTime.parse(expiryString);
      }

      return null;
    } catch (error, stackTrace) {
      debugPrint('❌ Error getting token expiry: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  /// Check if the stored token is expired
  ///
  /// Returns:
  /// - true if token is expired or expiry date not found
  /// - false if token is still valid
  Future<bool> isTokenExpired() async {
    try {
      final expiry = await getTokenExpiry();

      if (expiry == null) {
        debugPrint('⚠️ Token expiry not found, considering expired');
        return true;
      }

      final isExpired = DateTime.now().isAfter(expiry);

      if (isExpired) {
        debugPrint('⚠️ Token is expired (expired on: $expiry)');
      } else {
        final timeRemaining = expiry.difference(DateTime.now());
        debugPrint('✅ Token is valid (expires in: ${timeRemaining.inHours} hours)');
      }

      return isExpired;
    } catch (error) {
      debugPrint('❌ Error checking token expiry: $error');
      return true; // Assume expired on error
    }
  }

  /// Check if token should be refreshed
  ///
  /// Tokens should be refreshed if they expire within 24 hours
  /// This ensures users don't experience sudden logouts
  ///
  /// Returns:
  /// - true if token expires within 24 hours
  /// - false otherwise
  Future<bool> shouldRefreshToken() async {
    try {
      final expiry = await getTokenExpiry();

      if (expiry == null) {
        debugPrint('⚠️ Token expiry not found, cannot determine refresh need');
        return false;
      }

      // Refresh if token expires within 24 hours
      final oneDayBeforeExpiry = expiry.subtract(const Duration(days: 1));
      final shouldRefresh = DateTime.now().isAfter(oneDayBeforeExpiry);

      if (shouldRefresh) {
        final timeRemaining = expiry.difference(DateTime.now());
        debugPrint(
          '🔄 Token should be refreshed (expires in: ${timeRemaining.inHours} hours)',
        );
      }

      return shouldRefresh;
    } catch (error) {
      debugPrint('❌ Error checking token refresh need: $error');
      return false;
    }
  }

  // ===========================================================================
  // USER DATA MANAGEMENT
  // ===========================================================================

  /// Save user data to secure storage
  ///
  /// Stores user profile data as JSON
  ///
  /// Parameters:
  /// - [userData]: Map containing user information (id, email, role, etc.)
  Future<void> saveUser(Map<String, dynamic> userData) async {
    try {
      final userJson = jsonEncode(userData);
      await _storage.write(key: AppConstants.userKey, value: userJson);
      debugPrint('👤 User data saved successfully');
    } catch (error, stackTrace) {
      debugPrint('❌ Error saving user data: $error');
      debugPrint('Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Retrieve user data from secure storage
  ///
  /// Returns:
  /// - Map containing user data, or null if not found
  Future<Map<String, dynamic>?> getUser() async {
    try {
      final userJson = await _storage.read(key: AppConstants.userKey);

      if (userJson != null && userJson.isNotEmpty) {
        final userData = jsonDecode(userJson) as Map<String, dynamic>;
        debugPrint('👤 User data retrieved successfully');
        return userData;
      }

      debugPrint('👤 No user data found in storage');
      return null;
    } catch (error, stackTrace) {
      debugPrint('❌ Error retrieving user data: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  /// Delete user data from secure storage
  Future<void> deleteUser() async {
    try {
      await _storage.delete(key: AppConstants.userKey);
      debugPrint('👤 User data deleted successfully');
    } catch (error, stackTrace) {
      debugPrint('❌ Error deleting user data: $error');
      debugPrint('Stack trace: $stackTrace');
      rethrow;
    }
  }

  // ===========================================================================
  // STORAGE MANAGEMENT
  // ===========================================================================

  /// Clear all data from secure storage
  ///
  /// WARNING: This will delete all stored data including tokens and user info
  /// Use during logout or app reset
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
      debugPrint('🗑️ All secure storage cleared');
    } catch (error, stackTrace) {
      debugPrint('❌ Error clearing storage: $error');
      debugPrint('Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Get all stored keys (for debugging only)
  ///
  /// WARNING: Only use in development/debugging
  /// Returns a map of all stored key-value pairs
  Future<Map<String, String>> getAllData() async {
    try {
      final allData = await _storage.readAll();
      debugPrint('📦 Retrieved ${allData.length} items from storage');
      return allData;
    } catch (error, stackTrace) {
      debugPrint('❌ Error reading all storage data: $error');
      debugPrint('Stack trace: $stackTrace');
      return {};
    }
  }

  /// Check if storage contains a specific key
  ///
  /// Parameters:
  /// - [key]: The key to check
  ///
  /// Returns:
  /// - true if key exists, false otherwise
  Future<bool> containsKey(String key) async {
    try {
      final value = await _storage.read(key: key);
      return value != null;
    } catch (error) {
      debugPrint('❌ Error checking key existence: $error');
      return false;
    }
  }
}
