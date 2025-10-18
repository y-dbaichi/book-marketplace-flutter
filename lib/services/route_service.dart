// ==============================================================================
// ROUTE SERVICE
// ==============================================================================
// Service for calculating optimal delivery routes using OpenRouteService API
// Provides route optimization, distance calculations, and turn-by-turn directions
//
// Features:
// - Real routing via OpenRouteService API
// - Route optimization using nearest-neighbor algorithm
// - Mock data fallback for offline/error scenarios
// - Distance and duration calculations
// - Support for multiple waypoints (2+ points)
//
// Algorithm:
// - Nearest Neighbor: O(n²) greedy algorithm for route ordering
// - Haversine Formula: For accurate geographic distance calculations
//
// API Provider:
// - OpenRouteService (https://openrouteservice.org/)
// - Free tier: 2,000 requests/day
// - Rate limit: 40 requests/minute
//
// Note: For production, move API key to environment variables
// ==============================================================================

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../utils/constants.dart';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/// HTTP request timeout duration
const Duration _kHttpTimeout = Duration(seconds: 30);

/// Average driving speed for duration estimates (km/h)
/// Used when API doesn't provide duration or in mock mode
const double _kAverageSpeedKmh = 60.0;

/// Duration calculation factor (hours per meter)
/// Formula: duration = distance * factor
/// Example: 1000m * 0.06 = 60 seconds (at 60 km/h)
const double _kDurationFactor = 0.06;

/// Route curve simulation factor for mock routes
/// Creates realistic-looking curved paths between waypoints
const double _kRouteCurveFactor = 0.001;

/// Number of intermediate points between waypoints in mock routes
/// Higher number = smoother route visualization
const int _kMockIntermediatePoints = 3;

// ==============================================================================
// ROUTE SERVICE CLASS
// ==============================================================================

/// Service for route calculation and optimization
///
/// Implements the Singleton pattern to ensure consistent state and
/// efficient resource usage. Integrates with OpenRouteService API
/// for real-world routing and provides offline fallback capabilities.
///
/// Capabilities:
/// - Calculate driving routes between multiple waypoints
/// - Optimize delivery order to minimize distance
/// - Provide turn-by-turn navigation instructions
/// - Calculate total distance and estimated duration
/// - Generate GeoJSON routes for map visualization
///
/// Usage:
/// ```dart
/// final routeService = RouteService();
///
/// // Get route for delivery points
/// final route = await routeService.getRoute([
///   LatLng(33.5731, -7.5898), // Seller location
///   LatLng(33.5890, -7.6030), // Buyer 1
///   LatLng(33.5650, -7.5750), // Buyer 2
/// ]);
///
/// // Optimize order of delivery points
/// final optimized = routeService.optimizeRoute(
///   sellerLocation,
///   deliveryPoints,
/// );
/// ```
class RouteService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================

  /// Private static instance for singleton pattern
  static final RouteService _instance = RouteService._internal();

  /// Private constructor for singleton pattern
  RouteService._internal();

  /// Factory constructor returns the singleton instance
  factory RouteService() => _instance;

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /// OpenRouteService API base URL
  static const String _baseUrl = 'https://api.openrouteservice.org/v2';

  /// OpenRouteService API key
  ///
  /// SECURITY WARNING: In production, move this to:
  /// 1. Environment variables (recommended)
  /// 2. Secure cloud config (Firebase Remote Config, AWS Secrets Manager)
  /// 3. Backend proxy (most secure - hide API key completely)
  ///
  /// Current key is for development/demo purposes only
  /// Get your own free key at: https://openrouteservice.org/dev/#/signup
  static const String _apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBmYmNiMTA0ZjlhODQ4YjZiNWVmNWJjM2FiODZmZTU0IiwiaCI6Im11cm11cjY0In0=';

  /// Whether to use mock data instead of real API
  /// Set to true for offline testing or if no API key available
  static const bool _useMockData = false; // Set to true if you want to use mock data

  // ===========================================================================
  // ROUTE CALCULATION
  // ===========================================================================

  /// Calculate route through multiple waypoints
  ///
  /// Calls OpenRouteService API to get optimal driving route between points.
  /// Falls back to mock data if API is unavailable or returns an error.
  ///
  /// Parameters:
  /// - [waypoints]: List of geographic coordinates to route through (min 2 points)
  ///
  /// Returns:
  /// - GeoJSON FeatureCollection with route geometry and metadata
  /// - null if waypoints list is invalid
  ///
  /// Response format:
  /// ```dart
  /// {
  ///   'type': 'FeatureCollection',
  ///   'features': [{
  ///     'geometry': {
  ///       'type': 'LineString',
  ///       'coordinates': [[lng, lat], ...] // Route path
  ///     },
  ///     'properties': {
  ///       'summary': {
  ///         'distance': 15420.5, // meters
  ///         'duration': 1234.5,  // seconds
  ///       },
  ///       'segments': [...] // Turn-by-turn instructions
  ///     }
  ///   }]
  /// }
  /// ```
  Future<Map<String, dynamic>?> getRoute(List<LatLng> waypoints) async {
    // Validate input
    if (!_validateWaypoints(waypoints)) {
      debugPrint('❌ Invalid waypoints: Need at least 2 valid points');
      return null;
    }

    // Use mock data if configured
    if (_useMockData) {
      debugPrint('🔄 Using mock routing data (API disabled or no key)');
      return _getMockRoute(waypoints);
    }

    try {
      debugPrint('🌐 Requesting route from OpenRouteService (${waypoints.length} waypoints)...');

      // Choose appropriate API endpoint based on waypoint count
      if (waypoints.length == 2) {
        // Simple 2-point route: Use GET request (simpler, faster)
        return await _getSimpleRoute(waypoints[0], waypoints[1]);
      } else {
        // Multi-waypoint route: Use POST request with full options
        return await _getMultiWaypointRoute(waypoints);
      }
    } catch (error, stackTrace) {
      debugPrint('❌ Route service error: $error');
      debugPrint('Stack trace: $stackTrace');
      debugPrint('🔄 Falling back to mock route data');

      // Graceful degradation: Return mock route on error
      return _getMockRoute(waypoints);
    }
  }

  // ===========================================================================
  // API INTEGRATION - SIMPLE ROUTE (2 POINTS)
  // ===========================================================================

  /// Get route between two points using GET request
  ///
  /// Simpler API call for basic point-to-point routing.
  /// Used when only start and end locations are provided.
  ///
  /// Parameters:
  /// - [start]: Starting location coordinates
  /// - [end]: Destination location coordinates
  ///
  /// Returns:
  /// - GeoJSON route data from OpenRouteService
  /// - null on error
  Future<Map<String, dynamic>?> _getSimpleRoute(
    LatLng start,
    LatLng end,
  ) async {
    try {
      // Construct GET request URL with coordinates
      // Format: longitude,latitude (GeoJSON standard)
      final url = '$_baseUrl/directions/driving-car'
          '?api_key=$_apiKey'
          '&start=${start.longitude},${start.latitude}'
          '&end=${end.longitude},${end.latitude}';

      debugPrint('📡 GET Request to OpenRouteService');

      // Make HTTP request with timeout
      final response = await http
          .get(Uri.parse(url))
          .timeout(_kHttpTimeout);

      debugPrint('📡 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Route data received (GET)');
        return data;
      } else {
        // Log API error for debugging
        debugPrint('❌ API Error ${response.statusCode}: ${response.body}');
        return null;
      }
    } catch (error, stackTrace) {
      debugPrint('❌ Simple route request failed: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  // ===========================================================================
  // API INTEGRATION - MULTI-WAYPOINT ROUTE
  // ===========================================================================

  /// Get route through multiple waypoints using POST request
  ///
  /// Advanced routing with support for multiple delivery points.
  /// Provides detailed turn-by-turn instructions and route segments.
  ///
  /// Parameters:
  /// - [waypoints]: List of locations to route through in order
  ///
  /// Returns:
  /// - GeoJSON route data from OpenRouteService
  /// - null on error
  Future<Map<String, dynamic>?> _getMultiWaypointRoute(
    List<LatLng> waypoints,
  ) async {
    try {
      // Convert waypoints to GeoJSON coordinate format
      // Format: [longitude, latitude] (reversed from typical lat/lng)
      final coordinates = waypoints
          .map((point) => [point.longitude, point.latitude])
          .toList();

      debugPrint('📍 Routing through ${coordinates.length} waypoints');

      // Make POST request with route configuration
      final response = await http
          .post(
            Uri.parse('$_baseUrl/directions/driving-car/geojson'),
            headers: {
              'Authorization': _apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json, application/geo+json',
            },
            body: jsonEncode({
              'coordinates': coordinates,
              'instructions': true, // Include turn-by-turn directions
              'geometry': true, // Include route path geometry
              'preference': 'fastest', // Optimize for fastest route
              'units': 'km', // Distance units
            }),
          )
          .timeout(_kHttpTimeout);

      debugPrint('📡 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Route data received (POST)');
        return data;
      } else {
        // Log API error for debugging
        debugPrint('❌ API Error ${response.statusCode}: ${response.body}');
        return null;
      }
    } catch (error, stackTrace) {
      debugPrint('❌ Multi-waypoint route request failed: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  // ===========================================================================
  // MOCK DATA GENERATION (FALLBACK)
  // ===========================================================================

  /// Generate mock route for offline/demo mode
  ///
  /// Creates realistic-looking route with curved paths between waypoints.
  /// Used as fallback when API is unavailable or for offline testing.
  ///
  /// Features:
  /// - Curved intermediate points for visual realism
  /// - Calculated distance using Haversine formula
  /// - Estimated duration based on average speed
  /// - Mock turn-by-turn instructions in French
  ///
  /// Parameters:
  /// - [waypoints]: Delivery locations to connect
  ///
  /// Returns:
  /// - GeoJSON FeatureCollection matching OpenRouteService format
  Map<String, dynamic> _getMockRoute(List<LatLng> waypoints) {
    if (waypoints.isEmpty) return _getEmptyRoute();

    // Generate route coordinates with curved paths
    final coordinates = <List<double>>[];

    for (int i = 0; i < waypoints.length; i++) {
      // Add waypoint coordinate
      coordinates.add([
        waypoints[i].longitude,
        waypoints[i].latitude,
      ]);

      // Add intermediate curved points between waypoints
      if (i < waypoints.length - 1) {
        final current = waypoints[i];
        final next = waypoints[i + 1];

        // Create smooth curve between points
        for (int j = 1; j <= _kMockIntermediatePoints; j++) {
          final ratio = j / (_kMockIntermediatePoints + 1);

          // Linear interpolation
          var lat = current.latitude + (next.latitude - current.latitude) * ratio;
          var lng = current.longitude + (next.longitude - current.longitude) * ratio;

          // Add curve effect (simulate road curvature)
          // Peak curve in middle, smaller at edges
          final curveFactor = _kRouteCurveFactor * (j == 2 ? 1.0 : 0.5);
          lat += curveFactor * (j % 2 == 0 ? 1 : -1);
          lng += curveFactor * (j % 2 == 0 ? -1 : 1);

          coordinates.add([lng, lat]);
        }
      }
    }

    // Calculate route metrics
    final distanceMeters = _calculateTotalDistance(waypoints);
    final durationSeconds = distanceMeters * _kDurationFactor;

    // Return GeoJSON matching OpenRouteService format
    return {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'summary': {
              'distance': distanceMeters,
              'duration': durationSeconds,
            },
            'segments': [
              {
                'distance': distanceMeters,
                'duration': durationSeconds,
                'steps': _generateMockInstructions(waypoints),
              }
            ]
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates,
          }
        }
      ]
    };
  }

  /// Return empty GeoJSON collection
  ///
  /// Used when no waypoints are provided
  Map<String, dynamic> _getEmptyRoute() {
    return {
      'type': 'FeatureCollection',
      'features': <Map<String, dynamic>>[],
    };
  }

  /// Generate mock turn-by-turn instructions in French
  ///
  /// Creates realistic navigation instructions for each waypoint.
  /// Used in mock routes to simulate API response structure.
  ///
  /// Parameters:
  /// - [waypoints]: Route waypoints
  ///
  /// Returns:
  /// - List of instruction steps with distance and duration
  List<Map<String, dynamic>> _generateMockInstructions(List<LatLng> waypoints) {
    final instructions = <Map<String, dynamic>>[];

    for (int i = 0; i < waypoints.length; i++) {
      if (i == 0) {
        // Starting point
        instructions.add({
          'instruction': 'Départ du point de départ',
          'distance': 0.0,
          'duration': 0.0,
          'type': 10, // Instruction type: Depart
        });
      } else if (i == waypoints.length - 1) {
        // Destination
        instructions.add({
          'instruction': 'Arrivée à destination',
          'distance': 0.0,
          'duration': 0.0,
          'type': 10, // Instruction type: Arrive
        });
      } else {
        // Intermediate waypoint
        final segmentDistance = _calculateDistance(
          waypoints[i - 1],
          waypoints[i],
        );
        instructions.add({
          'instruction': 'Continuer vers le point ${i + 1}',
          'distance': segmentDistance,
          'duration': segmentDistance * _kDurationFactor,
          'type': 0, // Instruction type: Continue straight
        });
      }
    }

    return instructions;
  }

  // ===========================================================================
  // ROUTE OPTIMIZATION
  // ===========================================================================

  /// Optimize route order using nearest-neighbor algorithm
  ///
  /// Greedy algorithm that always picks the closest unvisited point.
  /// Time complexity: O(n²) where n is number of points.
  ///
  /// Algorithm:
  /// 1. Start at seller location
  /// 2. Find nearest unvisited delivery point
  /// 3. Move to that point
  /// 4. Repeat until all points visited
  ///
  /// Note: This is a heuristic approximation, not optimal solution.
  /// For optimal TSP solution, consider:
  /// - 2-opt improvement
  /// - Simulated annealing
  /// - Genetic algorithms
  ///
  /// Trade-off: Simple and fast, but may not find absolute shortest route.
  ///
  /// Parameters:
  /// - [startPoint]: Seller location (origin)
  /// - [points]: List of delivery locations to visit
  ///
  /// Returns:
  /// - Ordered list of waypoints minimizing total distance
  ///
  /// Example:
  /// ```dart
  /// final optimized = routeService.optimizeRoute(
  ///   LatLng(33.5731, -7.5898), // Seller
  ///   [
  ///     LatLng(33.5890, -7.6030), // Delivery 1
  ///     LatLng(33.5650, -7.5750), // Delivery 2
  ///     LatLng(33.5800, -7.5900), // Delivery 3
  ///   ],
  /// );
  /// // Returns: [seller, nearest, next_nearest, farthest]
  /// ```
  List<LatLng> optimizeRoute(LatLng startPoint, List<LatLng> points) {
    // Edge case: No delivery points
    if (points.isEmpty) {
      debugPrint('⚠️ No points to optimize, returning start point only');
      return [startPoint];
    }

    // Initialize route with starting point
    final optimizedRoute = <LatLng>[startPoint];
    final remainingPoints = List<LatLng>.from(points);
    var currentPoint = startPoint;

    final distance = const Distance();

    debugPrint('🔄 Optimizing route for ${points.length} delivery points...');

    // Greedy nearest-neighbor algorithm
    while (remainingPoints.isNotEmpty) {
      // Find nearest unvisited point
      var nearestPoint = remainingPoints.first;
      var nearestDistance = distance.as(
        LengthUnit.Meter,
        currentPoint,
        nearestPoint,
      );

      // Check all remaining points for closer option
      for (final point in remainingPoints) {
        final dist = distance.as(LengthUnit.Meter, currentPoint, point);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPoint = point;
        }
      }

      // Add nearest point to route
      optimizedRoute.add(nearestPoint);
      remainingPoints.remove(nearestPoint);
      currentPoint = nearestPoint;
    }

    debugPrint('✅ Route optimized: ${optimizedRoute.length} points total');
    return optimizedRoute;
  }

  // ===========================================================================
  // DISTANCE CALCULATIONS
  // ===========================================================================

  /// Calculate total distance for route through all waypoints
  ///
  /// Uses Haversine formula via latlong2 package for accurate
  /// geographic distance calculations accounting for Earth's curvature.
  ///
  /// Parameters:
  /// - [waypoints]: Ordered list of route points
  ///
  /// Returns:
  /// - Total distance in meters
  double _calculateTotalDistance(List<LatLng> waypoints) {
    if (waypoints.length < 2) return 0.0;

    double totalDistance = 0.0;
    final distance = const Distance();

    // Sum distances between consecutive waypoints
    for (int i = 0; i < waypoints.length - 1; i++) {
      totalDistance += distance.as(
        LengthUnit.Meter,
        waypoints[i],
        waypoints[i + 1],
      );
    }

    return totalDistance;
  }

  /// Calculate distance between two geographic points
  ///
  /// Uses Haversine formula for accurate great-circle distance.
  ///
  /// Parameters:
  /// - [point1]: First coordinate
  /// - [point2]: Second coordinate
  ///
  /// Returns:
  /// - Distance in meters
  double _calculateDistance(LatLng point1, LatLng point2) {
    final distance = const Distance();
    return distance.as(LengthUnit.Meter, point1, point2);
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  /// Validate waypoints list for routing
  ///
  /// Checks:
  /// - At least 2 waypoints required
  /// - All coordinates are valid (lat: -90 to 90, lng: -180 to 180)
  ///
  /// Parameters:
  /// - [waypoints]: List of coordinates to validate
  ///
  /// Returns:
  /// - true if valid, false otherwise
  bool _validateWaypoints(List<LatLng> waypoints) {
    // Need at least 2 points for a route
    if (waypoints.length < 2) {
      debugPrint('❌ Validation failed: Need at least 2 waypoints');
      return false;
    }

    // Validate each coordinate
    for (int i = 0; i < waypoints.length; i++) {
      final point = waypoints[i];

      // Check latitude range: -90 to 90
      if (point.latitude < -90 || point.latitude > 90) {
        debugPrint(
          '❌ Validation failed: Invalid latitude ${point.latitude} at waypoint $i',
        );
        return false;
      }

      // Check longitude range: -180 to 180
      if (point.longitude < -180 || point.longitude > 180) {
        debugPrint(
          '❌ Validation failed: Invalid longitude ${point.longitude} at waypoint $i',
        );
        return false;
      }
    }

    return true;
  }
}
