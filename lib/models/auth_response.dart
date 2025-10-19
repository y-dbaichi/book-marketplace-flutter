// ==============================================================================
// AUTHENTICATION RESPONSE MODEL
// ==============================================================================
// Data model for authentication API responses
// Handles login and token refresh responses from the backend
//
// Features:
// - Immutable data class
// - JSON deserialization
// - Safe defaults for missing values
// - Type-safe access to authentication data
//
// Used by:
// - AuthService for login operations
// - AuthService for token refresh operations
// ==============================================================================

import 'user.dart';

// ==============================================================================
// AUTH RESPONSE MODEL
// ==============================================================================

/// Represents the response from authentication endpoints
///
/// Returned by backend on:
/// - Successful login (POST /api/auth/login)
/// - Successful token refresh (POST /api/auth/refresh)
///
/// Contains:
/// - Success message from backend
/// - JWT authentication token (valid for 7 days)
/// - Complete user object with profile and permissions
class AuthResponse {
  /// Success message from backend
  ///
  /// Example: "Login successful", "Token refreshed successfully"
  final String message;

  /// JWT authentication token
  ///
  /// Format: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  /// Validity: 7 days from issue
  /// Usage: Include in Authorization header as "Bearer {token}"
  final String token;

  /// Complete user object
  ///
  /// Contains all user information including:
  /// - Basic info (id, email, userType)
  /// - Profile data (name, bio)
  /// - Location data (coordinates, address)
  final User user;

  /// Constructor
  const AuthResponse({
    required this.message,
    required this.token,
    required this.user,
  });

  /// Create AuthResponse from JSON response
  ///
  /// Deserializes authentication response from backend API
  /// Provides safe defaults for missing values:
  /// - Empty string for missing message
  /// - Empty string for missing token (will cause auth to fail safely)
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      message: json['message'] ?? '',
      token: json['token'] ?? '',
      user: User.fromJson(json['user']),
    );
  }
}
