// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Form Validators
///
/// Centralized validation logic following Single Responsibility Principle.
/// Removes validation logic from UI layer (pages/widgets).
///
/// **Responsibilities:**
/// - Email validation (format, emptiness)
/// - Password validation (length, emptiness)
/// - Phone validation (format)
/// - Generic field validation
///
/// **Usage:**
/// ```dart
/// TextFormField(
///   validator: FormValidators.email,
///   decoration: InputDecoration(labelText: 'Email'),
/// )
/// ```
library;

import '../utils/app_strings.dart';

/// Centralized form validation logic
///
/// Single responsibility: Validate user input
class FormValidators {
  // Private constructor to prevent instantiation
  FormValidators._();

  // ==========================================================================
  // EMAIL VALIDATION
  // ==========================================================================

  /// Email validation regex pattern
  ///
  /// Matches:
  /// - Standard email format: user@domain.com
  /// - Subdomains: user@subdomain.domain.com
  /// - Special characters: user+tag@domain.com
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  /// Validate email field
  ///
  /// Returns:
  /// - null if valid
  /// - Error message if invalid
  ///
  /// Validation rules:
  /// - Cannot be empty
  /// - Must match email format
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return AppStrings.validationRequired;
    }

    if (!_emailRegex.hasMatch(value.trim())) {
      return AppStrings.validationEmailInvalid;
    }

    return null;
  }

  /// Check if email is valid (boolean)
  ///
  /// Returns true if email is valid, false otherwise
  static bool isEmailValid(String? value) {
    return email(value) == null;
  }

  // ==========================================================================
  // PASSWORD VALIDATION
  // ==========================================================================

  /// Minimum password length
  static const int minPasswordLength = 6;

  /// Validate password field
  ///
  /// Returns:
  /// - null if valid
  /// - Error message if invalid
  ///
  /// Validation rules:
  /// - Cannot be empty
  /// - Must be at least 6 characters
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return AppStrings.validationPasswordRequired;
    }

    if (value.length < minPasswordLength) {
      return AppStrings.validationPasswordTooShort;
    }

    return null;
  }

  /// Check if password is valid (boolean)
  static bool isPasswordValid(String? value) {
    return password(value) == null;
  }

  // ==========================================================================
  // PHONE VALIDATION
  // ==========================================================================

  /// Phone validation regex pattern (flexible)
  ///
  /// Matches:
  /// - Moroccan format: 0612345678
  /// - International: +212612345678
  /// - With spaces: 06 12 34 56 78
  static final RegExp _phoneRegex = RegExp(
    r'^[\d\s\+\-\(\)]{10,}$',
  );

  /// Validate phone field
  ///
  /// Returns:
  /// - null if valid or empty (optional field)
  /// - Error message if invalid format
  static String? phone(String? value) {
    // Phone is optional
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    if (!_phoneRegex.hasMatch(value.trim())) {
      return 'Numéro de téléphone invalide';
    }

    return null;
  }

  // ==========================================================================
  // GENERIC FIELD VALIDATION
  // ==========================================================================

  /// Validate required field
  ///
  /// Generic validator for any required text field
  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return fieldName != null
          ? '$fieldName est requis'
          : AppStrings.validationRequired;
    }
    return null;
  }

  /// Validate minimum length
  static String? minLength(String? value, int length, {String? fieldName}) {
    if (value == null || value.length < length) {
      return fieldName != null
          ? '$fieldName doit contenir au moins $length caractères'
          : 'Doit contenir au moins $length caractères';
    }
    return null;
  }

  /// Validate maximum length
  static String? maxLength(String? value, int length, {String? fieldName}) {
    if (value != null && value.length > length) {
      return fieldName != null
          ? '$fieldName ne peut pas dépasser $length caractères'
          : 'Ne peut pas dépasser $length caractères';
    }
    return null;
  }

  /// Validate numeric field
  static String? numeric(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional
    }

    if (int.tryParse(value.trim()) == null) {
      return fieldName != null
          ? '$fieldName doit être un nombre'
          : 'Doit être un nombre';
    }

    return null;
  }

  /// Validate positive number
  static String? positiveNumber(String? value, {String? fieldName}) {
    final numericError = numeric(value, fieldName: fieldName);
    if (numericError != null) return numericError;

    if (value != null && value.trim().isNotEmpty) {
      final num = int.parse(value.trim());
      if (num <= 0) {
        return fieldName != null
            ? '$fieldName doit être positif'
            : 'Doit être un nombre positif';
      }
    }

    return null;
  }

  // ==========================================================================
  // COMPOSITE VALIDATORS
  // ==========================================================================

  /// Combine multiple validators
  ///
  /// Returns first error found, or null if all pass
  ///
  /// Example:
  /// ```dart
  /// validator: FormValidators.combine([
  ///   FormValidators.required,
  ///   (value) => FormValidators.minLength(value, 10),
  /// ])
  /// ```
  static String? Function(String?) combine(
    List<String? Function(String?)> validators,
  ) {
    return (String? value) {
      for (final validator in validators) {
        final error = validator(value);
        if (error != null) return error;
      }
      return null;
    };
  }
}
