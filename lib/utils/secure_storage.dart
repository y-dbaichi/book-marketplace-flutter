import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'constants.dart';

class SecureStorageService {
  static final SecureStorageService _instance = SecureStorageService._internal();
  late FlutterSecureStorage _storage;

  SecureStorageService._internal() {
    _storage = const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    );
  }

  factory SecureStorageService() => _instance;

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
    // Save token expiry (7 days from now, matching backend)
    final expiryDate = DateTime.now().add(const Duration(days: 7));
    await _storage.write(key: AppConstants.tokenExpiryKey, value: expiryDate.toIso8601String());
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.tokenExpiryKey);
  }

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<DateTime?> getTokenExpiry() async {
    final expiryString = await _storage.read(key: AppConstants.tokenExpiryKey);
    if (expiryString != null) {
      return DateTime.parse(expiryString);
    }
    return null;
  }

  Future<bool> isTokenExpired() async {
    final expiry = await getTokenExpiry();
    if (expiry == null) return true;
    return DateTime.now().isAfter(expiry);
  }

  Future<bool> shouldRefreshToken() async {
    final expiry = await getTokenExpiry();
    if (expiry == null) return false;

    // Refresh if token expires within 1 day
    final oneDayBeforeExpiry = expiry.subtract(const Duration(days: 1));
    return DateTime.now().isAfter(oneDayBeforeExpiry);
  }

  Future<void> saveUser(Map<String, dynamic> userData) async {
    final userJson = jsonEncode(userData);
    await _storage.write(key: AppConstants.userKey, value: userJson);
  }

  Future<Map<String, dynamic>?> getUser() async {
    final userJson = await _storage.read(key: AppConstants.userKey);
    if (userJson != null) {
      return jsonDecode(userJson) as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
