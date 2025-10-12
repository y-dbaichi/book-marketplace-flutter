import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  late Dio _dio;
  final SecureStorageService _storage = SecureStorageService();
  bool _isRefreshing = false;
  final List<Function> _refreshCallbacks = [];

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: Duration(seconds: AppConstants.apiTimeout),
        receiveTimeout: Duration(seconds: AppConstants.apiTimeout),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Check if token needs refresh before making request
          if (await _storage.shouldRefreshToken() && !_isRefreshing) {
            print('⏰ Token about to expire, refreshing...');
            await _refreshToken();
          }

          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          print('🌐 ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('✅ ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (error, handler) async {
          print('❌ ${error.response?.statusCode} ${error.requestOptions.path}');

          // Handle 401 Unauthorized - try to refresh token
          if (error.response?.statusCode == 401 && !_isRefreshing) {
            print('🔄 401 Error - Attempting token refresh...');

            // Try to refresh the token
            final refreshed = await _refreshToken();

            if (refreshed) {
              // Retry the original request with new token
              print('♻️ Retrying original request with refreshed token');
              final token = await _storage.getToken();
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer $token';

              try {
                final response = await _dio.fetch(options);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            } else {
              // Refresh failed, clear storage and redirect to login
              print('❌ Token refresh failed, clearing auth data');
              await _storage.clearAll();
            }
          }

          return handler.next(error);
        },
      ),
    );

    if (AppConstants.enableApiLogging) {
      _dio.interceptors.add(PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
      ));

    }
  }

  factory ApiService() => _instance;

  Future<bool> _refreshToken() async {
    if (_isRefreshing) {
      print('⏳ Already refreshing token, waiting...');
      return false;
    }

    _isRefreshing = true;

    try {
      print('🔄 Refreshing token...');
      final token = await _storage.getToken();

      if (token == null) {
        print('❌ No token to refresh');
        _isRefreshing = false;
        return false;
      }

      // Create a separate Dio instance for refresh to avoid interceptor loop
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: AppConstants.baseUrl,
          connectTimeout: Duration(seconds: AppConstants.apiTimeout),
          receiveTimeout: Duration(seconds: AppConstants.apiTimeout),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ),
      );

      final response = await refreshDio.post(AppConstants.refreshEndpoint);

      if (response.statusCode == 200) {
        final newToken = response.data['token'];
        await _storage.saveToken(newToken);
        print('✅ Token refreshed successfully');
        _isRefreshing = false;
        return true;
      } else {
        print('❌ Token refresh failed: ${response.statusCode}');
        _isRefreshing = false;
        return false;
      }
    } catch (e) {
      print('❌ Token refresh error: $e');
      _isRefreshing = false;
      return false;
    }
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }
}
