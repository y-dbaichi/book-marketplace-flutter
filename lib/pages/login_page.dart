// ==============================================================================
// LOGIN PAGE
// ==============================================================================
// Authentication page for seller login to the book delivery app
// This is the entry point for sellers to access their order management
//
// Features:
// - Email and password authentication
// - Form validation with user-friendly error messages
// - Loading state during authentication
// - Error display with visual feedback
// - Auto-navigation to orders page on success
// - Seller-only access (buyers cannot use this app)
// - Gradient background with Material 3 card design
//
// Architecture:
// - StatefulWidget with Form for validation
// - TextEditingController for input management
// - AuthService integration for backend authentication
// - Navigator for screen transitions
//
// User Flow:
// 1. Enter email and password
// 2. Submit form (button or keyboard Enter)
// 3. Validate inputs client-side
// 4. Send credentials to backend
// 5. Check if user is a seller (app restriction)
// 6. Navigate to SellerOrdersPage on success
// 7. Show error message on failure
//
// Security:
// - Password field obscured by default
// - Credentials sent over HTTPS
// - JWT token stored securely in FlutterSecureStorage
// - Seller-only validation prevents buyer access
// ==============================================================================

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'seller_orders_page.dart';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/// Card padding for login form
const double _kFormPadding = 32.0;

/// Outer container padding
const double _kContainerPadding = 24.0;

/// Card elevation shadow
const double _kCardElevation = 8.0;

/// Card border radius
const double _kCardBorderRadius = 16.0;

/// Input field border radius
const double _kInputBorderRadius = 12.0;

/// Button border radius
const double _kButtonBorderRadius = 12.0;

/// Error container border radius
const double _kErrorBorderRadius = 8.0;

/// App icon size
const double _kIconSize = 64.0;

/// Button height
const double _kButtonHeight = 50.0;

/// Loading indicator size
const double _kLoadingIndicatorSize = 20.0;

/// Loading indicator stroke width
const double _kLoadingStrokeWidth = 2.0;

/// Error container padding
const double _kErrorPadding = 12.0;

/// Spacing between major elements
const double _kMajorSpacing = 32.0;

/// Spacing between medium elements
const double _kMediumSpacing = 16.0;

/// Spacing between small elements
const double _kSmallSpacing = 8.0;

/// Spacing between tiny elements
const double _kTinySpacing = 4.0;

/// "Exception: " prefix length for error message cleanup
const int _kExceptionPrefixLength = 11;

// ==============================================================================
// LOGIN PAGE WIDGET
// ==============================================================================

/// Login page for seller authentication
///
/// This page allows sellers to authenticate and access their order management
/// dashboard. Only sellers can use this Flutter app - buyers use the web app.
///
/// The page features:
/// - Clean Material 3 design with gradient background
/// - Email and password fields with validation
/// - Real-time error display
/// - Loading state with spinner
/// - Keyboard shortcuts (Enter to submit)
/// - Auto-navigation on success
///
/// Usage:
/// ```dart
/// Navigator.push(
///   context,
///   MaterialPageRoute(builder: (_) => LoginPage()),
/// );
/// ```
class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

// ==============================================================================
// LOGIN PAGE STATE
// ==============================================================================

/// Private state class for LoginPage
///
/// Manages:
/// - Form validation state
/// - Text input controllers
/// - Authentication service
/// - Loading and error states
class _LoginPageState extends State<LoginPage> {
  // ---------------------------------------------------------------------------
  // STATE VARIABLES
  // ---------------------------------------------------------------------------

  /// Form key for validation
  ///
  /// Used to trigger form validation and access validation state
  final _formKey = GlobalKey<FormState>();

  /// Email input controller
  ///
  /// Manages email text field value and state
  final _emailController = TextEditingController();

  /// Password input controller
  ///
  /// Manages password text field value and state
  final _passwordController = TextEditingController();

  /// Authentication service singleton
  ///
  /// Handles login API calls and token management
  final _authService = AuthService();

  /// Loading state flag
  ///
  /// True when login request is in progress
  /// Disables button and shows spinner
  bool _isLoading = false;

  /// Error message from last failed login attempt
  ///
  /// Null when no error, displayed in red banner when present
  String? _errorMessage;

  // ---------------------------------------------------------------------------
  // LIFECYCLE METHODS
  // ---------------------------------------------------------------------------

  /// Dispose text controllers to prevent memory leaks
  ///
  /// Called when widget is removed from tree
  /// Critical for proper resource cleanup
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION HANDLER
  // ---------------------------------------------------------------------------

  /// Handle login form submission
  ///
  /// Flow:
  /// 1. Validate form inputs
  /// 2. Set loading state
  /// 3. Call AuthService.login()
  /// 4. Navigate to SellerOrdersPage on success
  /// 5. Display error message on failure
  ///
  /// The AuthService validates that the user is a seller before
  /// completing authentication. Buyers will receive an error.
  ///
  /// Uses mounted check before navigation to prevent navigation
  /// on disposed widget.
  Future<void> _handleLogin() async {
    // Validate form inputs
    if (!_formKey.currentState!.validate()) return;

    // Set loading state
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Attempt login via AuthService
      // Trim email to remove accidental whitespace
      await _authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      // Navigate to orders page on success
      // Check mounted to prevent navigation on disposed widget
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const SellerOrdersPage()),
        );
      }
    } catch (e) {
      // Clean up error message - remove "Exception:" prefix
      String errorMsg = e.toString();
      if (errorMsg.startsWith('Exception: ')) {
        errorMsg = errorMsg.substring(_kExceptionPrefixLength);
      }

      // Display error to user
      setState(() {
        _errorMessage = errorMsg;
        _isLoading = false;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // BUILD METHOD
  // ---------------------------------------------------------------------------

  /// Build the login page UI
  ///
  /// Layout structure:
  /// - Gradient background (blue theme)
  /// - Centered card with form
  /// - App icon and title
  /// - Email and password fields
  /// - Error banner (if error)
  /// - Login button with loading state
  ///
  /// Responsive design:
  /// - SingleChildScrollView prevents overflow on small screens
  /// - SafeArea respects device notches and bars
  /// - Card adapts to content size
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Background gradient
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.blue.shade400, Colors.blue.shade800],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(_kContainerPadding),
              child: Card(
                elevation: _kCardElevation,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(_kCardBorderRadius),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(_kFormPadding),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // App icon
                        Icon(Icons.book, size: _kIconSize, color: Colors.blue.shade700),
                        const SizedBox(height: _kMediumSpacing),

                        // App title
                        Text(
                          'Book Delivery',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade700,
                              ),
                        ),
                        const SizedBox(height: _kSmallSpacing),

                        // Subtitle: Sellers app
                        Text(
                          'Application Vendeurs',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.grey.shade600,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: _kTinySpacing),

                        // Description: Delivery tour planning
                        Text(
                          'Planification de tournées de livraison',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.grey.shade500),
                        ),
                        const SizedBox(height: _kMajorSpacing),

                        // Email Field
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next, // Move to next field
                          decoration: InputDecoration(
                            labelText: 'Email',
                            prefixIcon: const Icon(Icons.email),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(_kInputBorderRadius),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your email';
                            }
                            if (!value.contains('@')) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: _kMediumSpacing),

                        // Password Field
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true, // Hide password characters
                          textInputAction: TextInputAction.done, // Show "Done" button
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(_kInputBorderRadius),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password';
                            }
                            return null;
                          },
                          onFieldSubmitted: (_) => _handleLogin(), // Submit on Enter
                        ),

                        // Error Banner (shown only when error exists)
                        if (_errorMessage != null) ...[
                          const SizedBox(height: _kMediumSpacing),
                          Container(
                            padding: const EdgeInsets.all(_kErrorPadding),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(_kErrorBorderRadius),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.error, color: Colors.red.shade700),
                                const SizedBox(width: _kSmallSpacing),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: TextStyle(
                                      color: Colors.red.shade700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: _kMediumSpacing + _kSmallSpacing),

                        // Login Button
                        SizedBox(
                          width: double.infinity,
                          height: _kButtonHeight,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(_kButtonBorderRadius),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: _kLoadingIndicatorSize,
                                    width: _kLoadingIndicatorSize,
                                    child: CircularProgressIndicator(
                                      strokeWidth: _kLoadingStrokeWidth,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Login',
                                    style: TextStyle(fontSize: 16),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
