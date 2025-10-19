// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Error Handling Utilities
///
/// Centralized error handling utilities to eliminate code duplication
/// across the application. Provides consistent error message formatting,
/// HTTP status code handling, and user-friendly error display.
///
/// **Features:**
/// - Clean error message extraction from exceptions
/// - HTTP status code constants for type-safe comparisons
/// - Standardized error message formatting
/// - Reusable snackbar display helpers
/// - Type-safe error handling with proper exception types
///
/// **Usage:**
/// ```dart
/// try {
///   await apiCall();
/// } catch (e) {
///   final message = ErrorUtils.cleanErrorMessage(e.toString());
///   ErrorUtils.showErrorSnackBar(context, message);
/// }
/// ```
///
/// See also:
/// - [AppStrings] for localized error message constants
library;

import 'package:flutter/material.dart';
import 'app_strings.dart';

/// Utility class for consistent error handling across the application
///
/// This class provides static helper methods for:
/// - Cleaning and formatting error messages
/// - Displaying errors to users via snackbars
/// - Checking HTTP status codes
/// - Extracting meaningful error information from exceptions
///
/// All methods are static - no instantiation required.
class ErrorUtils {
  // Private constructor to prevent instantiation
  ErrorUtils._();

  // ============================================
  // HTTP STATUS CODES
  // ============================================

  /// HTTP 400 - Bad Request
  /// Used when request data is invalid or malformed
  static const int statusBadRequest = 400;

  /// HTTP 401 - Unauthorized
  /// Used when authentication is required or has failed
  static const int statusUnauthorized = 401;

  /// HTTP 404 - Not Found
  /// Used when requested resource doesn't exist
  static const int statusNotFound = 404;

  /// HTTP 500 - Internal Server Error
  /// Used when server encountered an unexpected error
  static const int statusServerError = 500;

  // ============================================
  // ERROR MESSAGE CLEANING
  // ============================================

  /// Cleans error message by removing common exception prefixes
  ///
  /// Removes patterns like:
  /// - "Exception: " prefix
  /// - "Error: " prefix
  /// - Extra whitespace
  ///
  /// **Parameters:**
  /// - [errorMessage]: Raw error message from exception
  ///
  /// **Returns:**
  /// Cleaned error message suitable for display to users
  ///
  /// **Example:**
  /// ```dart
  /// final raw = "Exception: Invalid credentials";
  /// final clean = ErrorUtils.cleanErrorMessage(raw);
  /// // Returns: "Invalid credentials"
  /// ```
  static String cleanErrorMessage(String errorMessage) {
    return errorMessage
        .replaceFirst('Exception: ', '')
        .replaceFirst('Error: ', '')
        .trim();
  }

  /// Extracts user-friendly error message from various error types
  ///
  /// Handles different error sources:
  /// - String errors (from API)
  /// - Exception objects
  /// - Generic Object errors
  ///
  /// **Parameters:**
  /// - [error]: Error object of any type
  ///
  /// **Returns:**
  /// User-friendly error message string
  ///
  /// **Example:**
  /// ```dart
  /// try {
  ///   throw Exception('Network timeout');
  /// } catch (e) {
  ///   final message = ErrorUtils.getErrorMessage(e);
  ///   // Returns: "Network timeout"
  /// }
  /// ```
  static String getErrorMessage(Object error) {
    if (error is String) {
      return cleanErrorMessage(error);
    } else if (error is Exception) {
      return cleanErrorMessage(error.toString());
    } else {
      return AppStrings.errorGeneric;
    }
  }

  // ============================================
  // HTTP STATUS CODE HELPERS
  // ============================================

  /// Checks if error message contains HTTP 401 Unauthorized
  ///
  /// Used to detect authentication failures and trigger re-login
  ///
  /// **Parameters:**
  /// - [errorMessage]: Error message to check
  ///
  /// **Returns:**
  /// true if error indicates unauthorized access
  ///
  /// **Example:**
  /// ```dart
  /// if (ErrorUtils.isUnauthorizedError(errorMsg)) {
  ///   // Redirect to login
  ///   Navigator.pushReplacementNamed(context, '/login');
  /// }
  /// ```
  static bool isUnauthorizedError(String errorMessage) {
    return errorMessage.contains('401') ||
        errorMessage.toLowerCase().contains('unauthorized') ||
        errorMessage.toLowerCase().contains('non autorisé');
  }

  /// Checks if error message contains HTTP 404 Not Found
  ///
  /// **Parameters:**
  /// - [errorMessage]: Error message to check
  ///
  /// **Returns:**
  /// true if error indicates resource not found
  static bool isNotFoundError(String errorMessage) {
    return errorMessage.contains('404') ||
        errorMessage.toLowerCase().contains('not found') ||
        errorMessage.toLowerCase().contains('introuvable');
  }

  /// Checks if error message contains HTTP 500 Server Error
  ///
  /// **Parameters:**
  /// - [errorMessage]: Error message to check
  ///
  /// **Returns:**
  /// true if error indicates server error
  static bool isServerError(String errorMessage) {
    return errorMessage.contains('500') ||
        errorMessage.toLowerCase().contains('server error') ||
        errorMessage.toLowerCase().contains('erreur serveur');
  }

  /// Checks if error is a network connectivity issue
  ///
  /// **Parameters:**
  /// - [errorMessage]: Error message to check
  ///
  /// **Returns:**
  /// true if error indicates network failure
  static bool isNetworkError(String errorMessage) {
    final lowerMsg = errorMessage.toLowerCase();
    return lowerMsg.contains('network') ||
        lowerMsg.contains('connexion') ||
        lowerMsg.contains('timeout') ||
        lowerMsg.contains('connection refused') ||
        lowerMsg.contains('failed to connect');
  }

  // ============================================
  // USER FEEDBACK HELPERS
  // ============================================

  /// Shows error message in a red snackbar
  ///
  /// Displays error at bottom of screen with red background
  /// for 4 seconds duration.
  ///
  /// **Parameters:**
  /// - [context]: BuildContext for showing snackbar
  /// - [message]: Error message to display
  /// - [duration]: How long to show (defaults to 4 seconds)
  ///
  /// **Example:**
  /// ```dart
  /// ErrorUtils.showErrorSnackBar(
  ///   context,
  ///   'Failed to load orders',
  /// );
  /// ```
  static void showErrorSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 4),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: duration,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// Shows success message in a green snackbar
  ///
  /// Displays success message at bottom of screen with green background
  /// for 3 seconds duration.
  ///
  /// **Parameters:**
  /// - [context]: BuildContext for showing snackbar
  /// - [message]: Success message to display
  /// - [duration]: How long to show (defaults to 3 seconds)
  ///
  /// **Example:**
  /// ```dart
  /// ErrorUtils.showSuccessSnackBar(
  ///   context,
  ///   'Order status updated successfully',
  /// );
  /// ```
  static void showSuccessSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: duration,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// Shows warning message in an orange snackbar
  ///
  /// Displays warning at bottom of screen with orange background
  /// for 3 seconds duration.
  ///
  /// **Parameters:**
  /// - [context]: BuildContext for showing snackbar
  /// - [message]: Warning message to display
  /// - [duration]: How long to show (defaults to 3 seconds)
  ///
  /// **Example:**
  /// ```dart
  /// ErrorUtils.showWarningSnackBar(
  ///   context,
  ///   'Please select at least one order',
  /// );
  /// ```
  static void showWarningSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.orange,
        duration: duration,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// Shows info message in a blue snackbar
  ///
  /// Displays informational message at bottom of screen with blue background
  /// for 3 seconds duration.
  ///
  /// **Parameters:**
  /// - [context]: BuildContext for showing snackbar
  /// - [message]: Info message to display
  /// - [duration]: How long to show (defaults to 3 seconds)
  ///
  /// **Example:**
  /// ```dart
  /// ErrorUtils.showInfoSnackBar(
  ///   context,
  ///   'Route calculation in progress...',
  /// );
  /// ```
  static void showInfoSnackBar(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.blue,
        duration: duration,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ============================================
  // ERROR DIALOG HELPERS
  // ============================================

  /// Shows error in an alert dialog instead of snackbar
  ///
  /// Use this for critical errors that require user acknowledgment
  /// before they can continue.
  ///
  /// **Parameters:**
  /// - [context]: BuildContext for showing dialog
  /// - [title]: Dialog title (defaults to "Erreur")
  /// - [message]: Error message to display
  ///
  /// **Example:**
  /// ```dart
  /// ErrorUtils.showErrorDialog(
  ///   context,
  ///   message: 'Failed to connect to server. Please check your internet connection.',
  /// );
  /// ```
  static Future<void> showErrorDialog(
    BuildContext context, {
    String title = 'Erreur',
    required String message,
  }) {
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  // ============================================
  // API ERROR MAPPING
  // ============================================

  /// Maps API error responses to user-friendly messages
  ///
  /// Converts technical error messages from backend into
  /// localized, user-friendly French messages.
  ///
  /// **Parameters:**
  /// - [apiErrorMessage]: Raw error from API
  ///
  /// **Returns:**
  /// User-friendly localized error message
  ///
  /// **Example:**
  /// ```dart
  /// final apiError = "User not found with email seller@example.com";
  /// final userMsg = ErrorUtils.mapApiError(apiError);
  /// // Returns: "Aucun compte trouvé avec cet email"
  /// ```
  static String mapApiError(String apiErrorMessage) {
    final lowerMsg = apiErrorMessage.toLowerCase();

    // Authentication errors
    if (lowerMsg.contains('invalid credentials') ||
        lowerMsg.contains('wrong password')) {
      return AppStrings.loginErrorInvalidCredentials;
    }
    if (lowerMsg.contains('user not found') || lowerMsg.contains('no user')) {
      return AppStrings.loginErrorAccountNotFound;
    }
    if (lowerMsg.contains('buyers cannot use this app') ||
        lowerMsg.contains('only sellers')) {
      return AppStrings.loginErrorSellerOnly;
    }

    // Network errors
    if (isNetworkError(apiErrorMessage)) {
      return AppStrings.errorNetworkFailure;
    }
    if (lowerMsg.contains('timeout') || lowerMsg.contains('timed out')) {
      return AppStrings.errorNetworkTimeout;
    }

    // HTTP status errors
    if (isUnauthorizedError(apiErrorMessage)) {
      return AppStrings.errorUnauthorized;
    }
    if (isNotFoundError(apiErrorMessage)) {
      return AppStrings.errorNotFound;
    }
    if (isServerError(apiErrorMessage)) {
      return AppStrings.errorServerError;
    }

    // Data validation errors
    if (lowerMsg.contains('invalid data') || lowerMsg.contains('validation')) {
      return AppStrings.errorInvalidData;
    }

    // Order-specific errors
    if (lowerMsg.contains('failed to load orders') ||
        lowerMsg.contains('impossible de charger')) {
      return AppStrings.orderLoadError;
    }

    // Map-specific errors
    if (lowerMsg.contains('location') && lowerMsg.contains('not available')) {
      return AppStrings.mapNoLocation;
    }
    if (lowerMsg.contains('permission denied')) {
      return AppStrings.mapLocationPermissionDenied;
    }
    if (lowerMsg.contains('location service disabled')) {
      return AppStrings.mapLocationServiceDisabled;
    }

    // Default: return cleaned message
    return cleanErrorMessage(apiErrorMessage);
  }
}
