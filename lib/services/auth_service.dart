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
    print('🔐 Attempting login for: $email');
    final request = LoginRequest(email: email, password: password);
    final response = await _api.post(AppConstants.loginEndpoint, data: request.toJson());
    final authResponse = AuthResponse.fromJson(response.data);
    
    await _storage.saveToken(authResponse.token);
    await _storage.saveUser(authResponse.user.toJson());
    _currentUser = authResponse.user;
    
    print('✅ Login successful: ${authResponse.user.email}');
    return authResponse;
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
      _currentUser = User.fromJson(userData);
      return true;
    }
    return false;
  }

  Future<bool> isLoggedIn() async {
    if (_currentUser != null) return true;
    return await loadUser();
  }
}
