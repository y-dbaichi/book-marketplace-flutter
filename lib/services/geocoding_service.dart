import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class GeocodingService {
  // Using Nominatim (OpenStreetMap) - Free, no API key required
  static const String _baseUrl = 'https://nominatim.openstreetmap.org';
  
  // Alternative: You can use OpenRouteService geocoding with API key
  // static const String _orsBaseUrl = 'https://api.openrouteservice.org/geocode';
  // static const String _apiKey = 'YOUR_ORS_API_KEY';

  /// Convert address to coordinates (Forward Geocoding)
  Future<List<GeocodingResult>> searchAddress(String address) async {
    if (address.trim().isEmpty) return [];

    try {
      final encodedAddress = Uri.encodeComponent(address);
      final url = '$_baseUrl/search?q=$encodedAddress&format=json&limit=5&addressdetails=1';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'User-Agent': 'LivreurApp/1.0', // Required by Nominatim
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => GeocodingResult.fromNominatim(item)).toList();
      } else {
        print('Geocoding error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Geocoding exception: $e');
      return [];
    }
  }

  /// Convert coordinates to address (Reverse Geocoding)
  Future<String?> getAddressFromCoordinates(double lat, double lng) async {
    try {
      final url = '$_baseUrl/reverse?lat=$lat&lon=$lng&format=json&addressdetails=1';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'User-Agent': 'LivreurApp/1.0',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['display_name'] as String?;
      } else {
        print('Reverse geocoding error: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Reverse geocoding exception: $e');
      return null;
    }
  }

  /// Get suggestions as user types (with debouncing)
  Future<List<GeocodingResult>> getSuggestions(String query) async {
    if (query.length < 3) return []; // Wait for at least 3 characters
    
    return await searchAddress(query);
  }
}

class GeocodingResult {
  final String displayName;
  final String address;
  final LatLng coordinates;
  final String? city;
  final String? country;
  final String? postcode;

  GeocodingResult({
    required this.displayName,
    required this.address,
    required this.coordinates,
    this.city,
    this.country,
    this.postcode,
  });

  factory GeocodingResult.fromNominatim(Map<String, dynamic> json) {
    final lat = double.parse(json['lat'].toString());
    final lng = double.parse(json['lon'].toString());
    final address = json['address'] as Map<String, dynamic>? ?? {};
    
    return GeocodingResult(
      displayName: json['display_name'] ?? '',
      address: json['display_name'] ?? '',
      coordinates: LatLng(lat, lng),
      city: address['city'] ?? address['town'] ?? address['village'],
      country: address['country'],
      postcode: address['postcode'],
    );
  }

  @override
  String toString() {
    return displayName;
  }
}

// For OpenRouteService Geocoding (if you want to use it instead)
class ORSGeocodingService {
  static const String _baseUrl = 'https://api.openrouteservice.org/geocode';
  static const String _apiKey = 'YOUR_ORS_API_KEY'; // Get from openrouteservice.org
  
  Future<List<GeocodingResult>> searchAddress(String address) async {
    if (_apiKey == 'YOUR_ORS_API_KEY') {
      throw Exception('Please set your OpenRouteService API key');
    }

    try {
      final url = '$_baseUrl/search?api_key=$_apiKey&text=$address&size=5';
      
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final features = data['features'] as List<dynamic>;
        
        return features.map((feature) => ORSGeocodingService.fromORS(feature)).toList();
      } else {
        print('ORS Geocoding error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('ORS Geocoding exception: $e');
      return [];
    }
  }

  static GeocodingResult fromORS(Map<String, dynamic> feature) {
    final geometry = feature['geometry'];
    final properties = feature['properties'];
    final coordinates = geometry['coordinates'] as List<dynamic>;
    
    return GeocodingResult(
      displayName: properties['label'] ?? '',
      address: properties['label'] ?? '',
      coordinates: LatLng(coordinates[1], coordinates[0]), // ORS uses [lng, lat]
      city: properties['locality'],
      country: properties['country'],
      postcode: properties['postalcode'],
    );
  }
}
