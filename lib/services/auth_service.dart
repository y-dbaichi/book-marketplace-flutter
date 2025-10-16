import '../models/auth_response.dart';
import '../models/user.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiService _api = ApiService();
  final SecureStorageService _storage = SecureStorageService();

  AuthService._internal();
  factory AuthService() => _instance;

  User? _currentUser;
  User? get currentUser => _currentUser;

  Future<AuthResponse> login(String email, String password) async {
    try {
      print('🔐 Attempting login for: $email');
      final request = LoginRequest(email: email, password: password);
      final response = await _api.post(AppConstants.loginEndpoint, data: request.toJson());
      final authResponse = AuthResponse.fromJson(response.data);

      // Check if user is a seller (Flutter app is for sellers only)
      if (authResponse.user.userType != 'seller') {
        print('❌ Login rejected: User is not a seller (type: ${authResponse.user.userType})');
        throw Exception('Cette application est réservée aux vendeurs uniquement. Veuillez utiliser la version web pour les acheteurs.');
      }

      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user.toJson());
      _currentUser = authResponse.user;

      print('✅ Login successful: ${authResponse.user.email} (seller)');
      return authResponse;
    } catch (e) {
      print('❌ Login error: $e');

      // Handle DioException with proper error messages
      if (e.toString().contains('DioException')) {
        // Check for specific HTTP status codes
        if (e.toString().contains('401') || e.toString().contains('400')) {
          throw Exception('Email ou mot de passe incorrect');
        } else if (e.toString().contains('404')) {
          throw Exception('Service de connexion indisponible');
        } else if (e.toString().contains('500')) {
          throw Exception('Erreur du serveur. Veuillez réessayer plus tard');
        } else if (e.toString().contains('SocketException') || e.toString().contains('Connection')) {
          throw Exception('Pas de connexion internet. Vérifiez votre réseau');
        }
        // Generic network error
        throw Exception('Erreur de connexion. Vérifiez votre connexion internet');
      }

      // Re-throw if it's already a clean exception (like seller check)
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    _currentUser = null;
    print('✅ Logout successful');
  }

  Future<bool> loadUser() async {
    final hasToken = await _storage.hasToken();
    if (!hasToken) return false;

    final userData = await _storage.getUser();
    if (userData != null) {
      final user = User.fromJson(userData);

      // Check if user is a seller (Flutter app is for sellers only)
      if (user.userType != 'seller') {
        print('❌ Auto-logout: User is not a seller (type: ${user.userType})');
        await logout();
        return false;
      }

      _currentUser = user;
      return true;
    }
    return false;
  }

  Future<bool> isLoggedIn() async {
    if (_currentUser != null) return true;
    return await loadUser();
  }

  Future<bool> refreshToken() async {
    try {
      print('🔄 Manually refreshing auth token...');
      final response = await _api.post(AppConstants.refreshEndpoint);
      final authResponse = AuthResponse.fromJson(response.data);

      // Check if user is a seller (Flutter app is for sellers only)
      if (authResponse.user.userType != 'seller') {
        print('❌ Token refresh rejected: User is not a seller');
        await logout();
        return false;
      }

      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user.toJson());
      _currentUser = authResponse.user;

      print('✅ Token refresh successful');
      return true;
    } catch (e) {
      print('❌ Token refresh failed: $e');
      return false;
    }
  }

  Future<bool> checkTokenValidity() async {
    try {
      // Check if token is expired
      if (await _storage.isTokenExpired()) {
        print('⚠️ Token is expired');
        await logout();
        return false;
      }

      // Check if token needs refresh
      if (await _storage.shouldRefreshToken()) {
        print('⏰ Token needs refresh');
        return await refreshToken();
      }

      return true;
    } catch (e) {
      print('❌ Token validity check failed: $e');
      return false;
    }
  }
}
