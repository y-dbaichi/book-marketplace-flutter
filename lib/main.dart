// ==============================================================================
// BOOK MARKETPLACE - FLUTTER MOBILE APPLICATION
// ==============================================================================
// Main entry point for the Book Marketplace mobile application
// Handles app initialization, authentication flow, and routing
//
// Features:
// - Secure authentication with JWT tokens
// - Automatic token refresh
// - Splash screen with auth check
// - Material 3 design
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'pages/login_page.dart';
import 'pages/seller_orders_page.dart';
import 'services/auth_service.dart';

// ==============================================================================
// MAIN ENTRY POINT
// ==============================================================================

/// Application entry point
/// Initializes Flutter bindings, sets up system UI, and launches the app
void main() async {
  // Ensure Flutter bindings are initialized before any async operations
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations (portrait only for better UX)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style (status bar, navigation bar)
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Set up global error handling
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('Flutter Error: ${details.exception}');
    debugPrint('Stack trace: ${details.stack}');
  };

  // Launch the application
  runApp(const MyApp());
}

// ==============================================================================
// ROOT APPLICATION WIDGET
// ==============================================================================

/// Root widget of the application
/// Configures Material app theme, routes, and initial screen
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // App metadata
      title: 'Book Marketplace',
      debugShowCheckedModeBanner: false,

      // Theme configuration
      theme: ThemeData(
        // Use Material 3 design system
        useMaterial3: true,

        // Primary color scheme
        primarySwatch: Colors.blue,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),

        // App bar theme
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
        ),

        // Card theme
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),

        // Button themes
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(
              horizontal: 32,
              vertical: 16,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),

        // Input decoration theme
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          filled: true,
          fillColor: Colors.grey[100],
        ),
      ),

      // Initial route
      home: const SplashPage(),
    );
  }
}

// ==============================================================================
// SPLASH SCREEN WITH AUTHENTICATION CHECK
// ==============================================================================

/// Splash screen widget
/// Displays app branding while checking authentication status
/// Automatically navigates to appropriate screen based on auth state
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  // Services
  final AuthService _authService = AuthService();

  // State
  String _statusMessage = 'Loading...';
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  /// Initialize the application
  /// Checks authentication status and navigates to appropriate screen
  Future<void> _initializeApp() async {
    try {
      // Show splash for minimum duration for better UX
      await Future.delayed(const Duration(milliseconds: 1500));

      // Update status
      if (mounted) {
        setState(() => _statusMessage = 'Checking authentication...');
      }

      // Check if user is logged in
      final isLoggedIn = await _authService.isLoggedIn();

      if (isLoggedIn) {
        // Verify token validity
        if (mounted) {
          setState(() => _statusMessage = 'Verifying credentials...');
        }

        final isValid = await _authService.checkTokenValidity();

        // Navigate based on token validity
        if (mounted) {
          _navigateToHome(isValid);
        }
      } else {
        // No auth token found, go to login
        if (mounted) {
          _navigateToLogin();
        }
      }
    } catch (error, stackTrace) {
      // Handle initialization errors
      debugPrint('App initialization error: $error');
      debugPrint('Stack trace: $stackTrace');

      if (mounted) {
        setState(() {
          _hasError = true;
          _statusMessage = 'Error initializing app';
        });

        // Show error and navigate to login after delay
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          _navigateToLogin();
        }
      }
    }
  }

  /// Navigate to home screen (seller orders)
  void _navigateToHome(bool isValid) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => isValid ? const SellerOrdersPage() : const LoginPage(),
      ),
    );
  }

  /// Navigate to login screen
  void _navigateToLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const LoginPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.blue.shade400,
              Colors.blue.shade800,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App icon
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(
                    Icons.book,
                    size: 80,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 32),

                // App title
                const Text(
                  'Book Marketplace',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 1.2,
                  ),
                ),

                const SizedBox(height: 8),

                // Subtitle
                Text(
                  'Seller Delivery Management',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.9),
                    fontWeight: FontWeight.w300,
                  ),
                ),

                const SizedBox(height: 48),

                // Loading indicator or error icon
                if (!_hasError)
                  const CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 3,
                  )
                else
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Colors.white.withOpacity(0.8),
                  ),

                const SizedBox(height: 16),

                // Status message
                Text(
                  _statusMessage,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
