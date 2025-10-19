// ==============================================================================
// ROUTE SERVICE - WHAT IS THIS FILE?
// ==============================================================================
//
// This file helps sellers plan the best delivery route for their books.
//
// REAL-WORLD EXAMPLE:
// Imagine you're a seller with 5 book orders to deliver today:
// - Order 1: Customer at location A
// - Order 2: Customer at location B
// - Order 3: Customer at location C
// - Order 4: Customer at location D
// - Order 5: Customer at location E
//
// PROBLEM: What order should you visit them to save time and gas?
// SOLUTION: This service figures out the best order automatically!
//
// HOW IT WORKS:
// 1. Gets your current location (seller)
// 2. Finds which customer is closest → go there first
// 3. From that customer, finds the next closest → go there second
// 4. Repeats until all customers are visited
// 5. Gives you turn-by-turn directions for the whole route
//
// WHY WE NEED OPENROUTESERVICE API:
// - Calculates real road distances (not straight lines through buildings!)
// - Gives turn-by-turn directions like Google Maps
// - Free for up to 2,000 routes per day
//
// ==============================================================================

import 'dart:convert'; // For JSON encoding/decoding
import 'package:flutter/foundation.dart'; // For debugPrint()
import 'package:http/http.dart' as http; // For making API calls
import 'package:latlong2/latlong.dart'; // For GPS coordinates (latitude/longitude)
import '../utils/constants.dart';

// ==============================================================================
// CONFIGURATION VALUES
// ==============================================================================
// These are settings that control how the route service behaves

/// How long to wait for API response before timeout (30 seconds)
/// WHY: Prevents app from hanging if internet is slow or API is down
const Duration _httpTimeoutDuration = Duration(seconds: 30);

/// Average urban driving speed (60 km/h)
/// WHY: Used to estimate delivery time when actual duration unavailable
/// EXAMPLE: 30km route → estimated time = 30 / 60 = 0.5 hours (30 minutes)
const double _averageSpeedKmh = 60.0;

/// Conversion factor: meters to seconds at average speed
/// WHY: Quickly estimate time from distance
/// FORMULA: seconds = meters * 0.06 (based on 60 km/h)
/// EXAMPLE: 1000 meters * 0.06 = 60 seconds = 1 minute
const double _metersToSecondsFactor = 0.06;

/// Curve intensity for fallback route visualization (offline mode)
/// WHY: Adds realistic bends to make routes look like real roads
/// SMALL VALUE: Routes look more natural on map
const double _mockRouteCurveFactor = 0.001;

/// Number of curve points between waypoints (fallback routes)
/// WHY: More points = smoother, more realistic-looking route curves
/// VALUE: 3 points creates nice S-curves between delivery stops
const int _curvePointsPerSegment = 3;

// ==============================================================================
// MAIN SERVICE CLASS
// ==============================================================================

/// RouteService - THE BRAIN OF ROUTE PLANNING
///
/// SINGLETON PATTERN EXPLANATION:
/// Instead of creating new RouteService() everywhere in your app,
/// we create ONE instance that everyone shares.
///
/// WHY USE SINGLETON?
/// - Save memory (only one copy exists)
/// - Consistent state (everyone sees the same data)
/// - Easier to debug (only one place to look)
///
/// HOW TO USE:
/// ```dart
/// // Anywhere in your app, just do this:
/// final routeService = RouteService();
///
/// // Example 1: Optimize delivery order
/// final optimizedRoute = routeService.optimizeRoute(
///   myShopLocation,      // Where I am
///   customerLocations,   // Where customers are
/// );
/// // Result: List of locations in best order to visit
///
/// // Example 2: Get turn-by-turn directions
/// final directions = await routeService.getRoute([
///   myShopLocation,
///   customer1Location,
///   customer2Location,
/// ]);
/// // Result: "Turn right on Main St, go 2km, turn left..."
/// ```
class RouteService {
  // ==========================================================================
  // SINGLETON PATTERN IMPLEMENTATION
  // ==========================================================================

  // This is the ONE instance of RouteService that exists
  // The word 'static' means it belongs to the CLASS itself, not to objects
  static final RouteService _instance = RouteService._internal();

  // Private constructor (the underscore _ makes it private)
  // WHY: Prevents anyone from creating new RouteService() instances
  // Only WE can create it using _internal()
  RouteService._internal();

  // Factory constructor - the "public door" to get the instance
  // WHY: When someone calls RouteService(), they get the existing _instance
  // NOT a new object!
  factory RouteService() => _instance;

  // ==========================================================================
  // API SETTINGS
  // ==========================================================================

  /// OpenRouteService API web address
  /// WHAT IT IS: Like Google Maps, but free and open-source
  static const String _baseUrl = 'https://api.openrouteservice.org/v2';

  /// API Key - YOUR PASSWORD to use OpenRouteService
  ///
  /// WHAT IS AN API KEY?
  /// It's like a password that proves you're allowed to use the service.
  /// This one gives you 2,000 free routes per day.
  ///
  /// ⚠️ SECURITY WARNING:
  /// In a real production app, DON'T put the key here!
  /// Instead, put it in:
  /// - Environment variables (files not uploaded to GitHub)
  /// - Your backend server (so users can't see it)
  /// - Firebase Remote Config (Google's secure storage)
  ///
  /// HOW TO GET YOUR OWN KEY (FREE):
  /// 1. Go to https://openrouteservice.org/dev/#/signup
  /// 2. Create free account
  /// 3. Copy your API key
  /// 4. Replace this key with yours
  static const String _apiKey =
      'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBmYmNiMTA0ZjlhODQ4YjZiNWVmNWJjM2FiODZmZTU0IiwiaCI6Im11cm11cjY0In0=';

  /// Should we use fake data instead of real API?
  ///
  /// SET TO TRUE IF:
  /// - Testing without internet
  /// - You don't have an API key yet
  /// - Want to save API calls during development
  ///
  /// SET TO FALSE IF:
  /// - Want real turn-by-turn directions
  /// - Need accurate distances
  /// - App is ready for real users
  static const bool _useMockData = false;

  // ==========================================================================
  // MAIN PUBLIC METHOD - GET ROUTE
  // ==========================================================================

  /// Get driving directions between multiple delivery points
  ///
  /// WHAT THIS DOES:
  /// Takes a list of GPS locations and returns turn-by-turn directions
  /// connecting them in order.
  ///
  /// INPUT: List of coordinates (minimum 2)
  /// ```dart
  /// [
  ///   LatLng(33.5731, -7.5898),  // Shop
  ///   LatLng(33.5890, -7.6030),  // Customer 1
  ///   LatLng(33.5650, -7.5750),  // Customer 2
  /// ]
  /// ```
  ///
  /// OUTPUT: Route information including:
  /// ```dart
  /// {
  ///   'type': 'FeatureCollection',
  ///   'features': [{
  ///     'geometry': {
  ///       'coordinates': [[lng, lat], [lng, lat], ...]  // Path to draw on map
  ///     },
  ///     'properties': {
  ///       'summary': {
  ///         'distance': 15420.5,  // Total distance in meters
  ///         'duration': 1234.5,   // Time in seconds
  ///       },
  ///       'segments': [...]  // Turn-by-turn: "Turn right", "Go straight"...
  ///     }
  ///   }]
  /// }
  /// ```
  ///
  /// RETURNS NULL IF:
  /// - Less than 2 points provided (can't make route with 1 point!)
  /// - Coordinates are invalid (latitude > 90 or < -90, etc.)
  Future<Map<String, dynamic>?> getRoute(List<LatLng> waypoints) async {
    // STEP 1: Check if input is valid
    // WHY: Prevent crashes from bad data
    if (!_validateWaypoints(waypoints)) {
      debugPrint('❌ Invalid waypoints: Need at least 2 valid points');
      return null; // Stop here if data is bad
    }

    // STEP 2: If using fake data mode, skip API and use fallback
    if (_useMockData) {
      debugPrint('🔄 Using fallback routing data (API disabled)');
      return _generateFallbackRoute(waypoints);
    }

    // STEP 3: Try to get real route from OpenRouteService API
    try {
      debugPrint('🌐 Requesting route from OpenRouteService (${waypoints.length} waypoints)...');

      // Choose which API method based on number of points
      if (waypoints.length == 2) {
        // Just 2 points? Use simpler GET request (faster)
        return await _fetchTwoPointRoute(waypoints[0], waypoints[1]);
      } else {
        // 3+ points? Use advanced POST request (more features)
        return await _fetchMultiWaypointRoute(waypoints);
      }
    } catch (error, stackTrace) {
      // STEP 4: If API fails (no internet, server down, etc.)
      // Don't crash! Instead, use fallback data so app still works
      debugPrint('❌ Route service error: $error');
      debugPrint('Stack trace: $stackTrace');
      debugPrint('🔄 Falling back to generated route data');

      return _generateFallbackRoute(waypoints);
    }
  }

  // ==========================================================================
  // PRIVATE METHOD - TWO-POINT ROUTE (START → END)
  // ==========================================================================

  /// Fetch route between exactly 2 points using simple GET request
  ///
  /// WHY THIS EXISTS:
  /// For just point A → point B, we can use a simpler, faster API call.
  /// Like asking for directions vs planning a whole road trip.
  ///
  /// WHEN IT'S USED:
  /// Only when waypoints.length == 2 (start and end only)
  ///
  /// HOW IT WORKS:
  /// 1. Build URL with start and end coordinates
  /// 2. Send HTTP GET request to API
  /// 3. Wait maximum 30 seconds for response
  /// 4. If successful (status 200), return route data
  /// 5. If failed, return null
  Future<Map<String, dynamic>?> _fetchTwoPointRoute(
    LatLng start,
    LatLng end,
  ) async {
    try {
      // Build the URL
      // EXAMPLE: https://api.openrouteservice.org/v2/directions/driving-car
      //          ?api_key=ABC123&start=-7.5898,33.5731&end=-7.6030,33.5890
      //
      // NOTE: Coordinates are in "longitude,latitude" order (GeoJSON standard)
      // This is BACKWARDS from how we usually say "latitude, longitude"!
      final url = '$_baseUrl/directions/driving-car'
          '?api_key=$_apiKey'
          '&start=${start.longitude},${start.latitude}'
          '&end=${end.longitude},${end.latitude}';

      debugPrint('📡 Sending GET request to OpenRouteService...');

      // Send the request and wait max 30 seconds
      final response = await http.get(Uri.parse(url)).timeout(_httpTimeoutDuration);

      debugPrint('📡 Response status: ${response.statusCode}');

      // Check if request succeeded
      if (response.statusCode == 200) {
        // Success! Convert JSON text to Dart map
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Route data received successfully (GET)');
        return data;
      } else {
        // Failed! Log error for debugging
        debugPrint('❌ API Error ${response.statusCode}: ${response.body}');
        return null;
      }
    } catch (error, stackTrace) {
      debugPrint('❌ Simple route request failed: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  // ==========================================================================
  // PRIVATE METHOD - MULTI-WAYPOINT ROUTE (3+ POINTS)
  // ==========================================================================

  /// Fetch route through 3 or more points using advanced POST request
  ///
  /// WHY THIS EXISTS:
  /// For complex routes with multiple stops, we need:
  /// - Turn-by-turn instructions at each stop
  /// - Distance and time for each segment
  /// - Option to optimize route order (future feature)
  ///
  /// DIFFERENCE FROM _fetchTwoPointRoute:
  /// - Uses POST instead of GET (can send more data)
  /// - Returns more detailed information
  /// - Supports route customization (fastest vs shortest)
  ///
  /// HOW IT WORKS:
  /// 1. Convert waypoints to API format: [[lng, lat], [lng, lat], ...]
  /// 2. Send POST request with JSON body containing coordinates
  /// 3. Request turn-by-turn instructions and route geometry
  /// 4. Wait for response (max 30 seconds)
  /// 5. Return route data or null if failed
  Future<Map<String, dynamic>?> _fetchMultiWaypointRoute(
    List<LatLng> waypoints,
  ) async {
    try {
      // Convert from our format to API format
      // OUR FORMAT: [LatLng(lat, lng), LatLng(lat, lng), ...]
      // API FORMAT: [[lng, lat], [lng, lat], ...]
      //
      // NOTICE: Longitude comes FIRST in API format (GeoJSON standard)
      final coordinates = waypoints
          .map((point) => [point.longitude, point.latitude])
          .toList();

      debugPrint('📍 Routing through ${coordinates.length} waypoints');

      // Send POST request with configuration
      final response = await http
          .post(
            Uri.parse('$_baseUrl/directions/driving-car/geojson'),
            headers: {
              'Authorization': _apiKey, // Prove we're allowed to use API
              'Content-Type': 'application/json', // Tell server we're sending JSON
              'Accept': 'application/json, application/geo+json', // We accept GeoJSON response
            },
            body: jsonEncode({
              'coordinates': coordinates, // The waypoints to route through

              // Request options (what we want in the response):
              'instructions': true, // YES: Give me turn-by-turn ("Turn left on Main St...")
              'geometry': true, // YES: Give me route path for drawing on map
              'preference': 'fastest', // Optimize for TIME (not distance)
              'units': 'km', // Use kilometers (you can change to 'mi' for miles)
            }),
          )
          .timeout(_httpTimeoutDuration); // Give up after 30 seconds

      debugPrint('📡 Response status: ${response.statusCode}');

      // Check if request succeeded
      if (response.statusCode == 200) {
        // Success! Parse JSON response
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Route data received successfully (POST)');
        return data;
      } else {
        // Failed! Log error
        debugPrint('❌ API Error ${response.statusCode}: ${response.body}');
        return null;
      }
    } catch (error, stackTrace) {
      debugPrint('❌ Multi-waypoint route request failed: $error');
      debugPrint('Stack trace: $stackTrace');
      return null;
    }
  }

  // ==========================================================================
  // PRIVATE METHOD - GENERATE FALLBACK ROUTE (OFFLINE MODE)
  // ==========================================================================

  /// Generate fallback route data when API is unavailable
  ///
  /// WHY THIS EXISTS:
  /// If internet is down or API fails, app shouldn't crash!
  /// Instead, we create realistic-looking fallback data so user can still
  /// see something on the map.
  ///
  /// WHAT IT CREATES:
  /// - Curved line connecting all waypoints (looks like a road)
  /// - Calculated distance using math (Haversine formula)
  /// - Estimated time based on average speed
  /// - Generic turn-by-turn instructions in French
  ///
  /// HOW THE CURVE WORKS:
  /// Instead of straight line A → B, we add extra points in between:
  /// A → (curve point 1) → (curve point 2) → (curve point 3) → B
  /// This makes it look more like real roads which curve and bend.
  ///
  /// IMPORTANT: This is NOT as accurate as real API!
  /// - Doesn't know about real roads
  /// - Doesn't know about traffic
  /// - Just draws curves between points
  /// - But it's better than nothing!
  Map<String, dynamic> _generateFallbackRoute(List<LatLng> waypoints) {
    // Safety check (should never happen because caller validates)
    assert(
      waypoints.length >= 2,
      'Waypoints must be validated before calling _generateFallbackRoute',
    );

    // Storage for all route coordinates (including curve points)
    final coordinates = <List<double>>[];

    // STEP 1: Create curved path through all waypoints
    for (int i = 0; i < waypoints.length; i++) {
      // Add the actual waypoint
      coordinates.add([
        waypoints[i].longitude,
        waypoints[i].latitude,
      ]);

      // If not the last point, add curve to next waypoint
      if (i < waypoints.length - 1) {
        final current = waypoints[i];
        final next = waypoints[i + 1];

        // Add 3 intermediate points between current and next
        // This creates smooth curve instead of sharp corner
        for (int j = 1; j <= _curvePointsPerSegment; j++) {
          // Calculate position along the line (0.25, 0.5, 0.75)
          final ratio = j / (_curvePointsPerSegment + 1);

          // Linear interpolation: point between current and next
          // EXAMPLE: If current is (0,0) and next is (10,10)
          //          and ratio is 0.5, point is (5,5) - the midpoint
          var lat = current.latitude + (next.latitude - current.latitude) * ratio;
          var lng = current.longitude + (next.longitude - current.longitude) * ratio;

          // Add curve effect to make it look like real road
          // Middle point gets more curve, edge points get less
          final curveFactor = _mockRouteCurveFactor * (j == 2 ? 1.0 : 0.5);

          // Alternate left/right to create S-curve
          lat += curveFactor * (j % 2 == 0 ? 1 : -1);
          lng += curveFactor * (j % 2 == 0 ? -1 : 1);

          coordinates.add([lng, lat]);
        }
      }
    }

    // STEP 2: Calculate route metrics
    final distanceMeters = _calculateTotalDistance(waypoints);
    final durationSeconds = distanceMeters * _metersToSecondsFactor;

    // STEP 3: Return in same format as real API
    // (So rest of app doesn't know the difference!)
    return {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'summary': {
              'distance': distanceMeters, // How far (meters)
              'duration': durationSeconds, // How long (seconds)
            },
            'segments': [
              {
                'distance': distanceMeters,
                'duration': durationSeconds,
                'steps': _generateFallbackInstructions(waypoints), // Generic directions
              }
            ]
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates, // The curved path
          }
        }
      ]
    };
  }

  // ==========================================================================
  // PRIVATE METHOD - GENERATE FALLBACK TURN-BY-TURN INSTRUCTIONS
  // ==========================================================================

  /// Create generic navigation instructions for each waypoint
  ///
  /// WHY THIS EXISTS:
  /// When using fallback route (offline mode), we still want to show
  /// something in the turn-by-turn list. These are generic instructions
  /// like "Continue to point 2", "Arrive at destination".
  ///
  /// NOT REALISTIC, BUT BETTER THAN NOTHING!
  ///
  /// WHAT IT CREATES:
  /// - First point: "Départ du point de départ" (Start from starting point)
  /// - Middle points: "Continuer vers le point X" (Continue to point X)
  /// - Last point: "Arrivée à destination" (Arrive at destination)
  List<Map<String, dynamic>> _generateFallbackInstructions(List<LatLng> waypoints) {
    final instructions = <Map<String, dynamic>>[];

    for (int i = 0; i < waypoints.length; i++) {
      if (i == 0) {
        // STARTING POINT
        instructions.add({
          'instruction': 'Départ du point de départ', // "Start from starting point"
          'distance': 0.0, // Haven't moved yet
          'duration': 0.0, // No time elapsed
          'type': 10, // Type 10 = Departure
        });
      } else if (i == waypoints.length - 1) {
        // FINAL DESTINATION
        instructions.add({
          'instruction': 'Arrivée à destination', // "Arrive at destination"
          'distance': 0.0, // Distance to destination is 0 (you're there!)
          'duration': 0.0,
          'type': 10, // Type 10 = Arrival
        });
      } else {
        // MIDDLE WAYPOINT
        // Calculate distance from previous point to this point
        final distance = const Distance();
        final segmentDistance = distance.as(
          LengthUnit.Meter,
          waypoints[i - 1],
          waypoints[i],
        );

        instructions.add({
          'instruction': 'Continuer vers le point ${i + 1}', // "Continue to point X"
          'distance': segmentDistance, // How far to this waypoint
          'duration': segmentDistance * _metersToSecondsFactor, // Estimated time
          'type': 0, // Type 0 = Continue straight
        });
      }
    }

    return instructions;
  }

  // ==========================================================================
  // PUBLIC METHOD - OPTIMIZE ROUTE ORDER
  // ==========================================================================

  /// Find best order to visit delivery points (Nearest-Neighbor Algorithm)
  ///
  /// THE TRAVELING SALESMAN PROBLEM (TSP):
  /// Given a list of cities and distances between them, what's the shortest
  /// route that visits each city exactly once and returns to start?
  ///
  /// THIS IS A FAMOUS HARD PROBLEM IN COMPUTER SCIENCE!
  /// No known "perfect" solution for large numbers of points.
  ///
  /// OUR SOLUTION: Greedy Nearest-Neighbor Algorithm
  ///
  /// HOW IT WORKS:
  /// 1. Start at your shop
  /// 2. Look at all unvisited customers → find the CLOSEST one
  /// 3. Go to that customer
  /// 4. Look at remaining customers → find the CLOSEST to current location
  /// 5. Repeat until all customers visited
  ///
  /// VISUAL EXAMPLE:
  /// ```
  /// You are here: 🏪 (Shop)
  /// Customers: A, B, C, D
  ///
  /// Distances from shop:
  /// 🏪 → A: 5km
  /// 🏪 → B: 2km (CLOSEST!)
  /// 🏪 → C: 8km
  /// 🏪 → D: 3km
  ///
  /// Step 1: Go to B (closest to shop)
  /// Step 2: From B, find closest unvisited → D (1km away)
  /// Step 3: From D, find closest unvisited → A (2km away)
  /// Step 4: From A, only C left → go there
  ///
  /// Final route: 🏪 → B → D → A → C
  /// ```
  ///
  /// IS THIS PERFECT?
  /// No! Sometimes there's a better route we miss.
  /// But it's FAST and GOOD ENOUGH for 5-20 deliveries.
  ///
  /// COMPLEXITY: O(n²) - If you have 10 points, does ~100 calculations
  ///
  /// BETTER ALGORITHMS EXIST:
  /// - 2-opt improvement (fixes obvious mistakes)
  /// - Simulated annealing (tries random changes)
  /// - Genetic algorithms (evolution-inspired)
  /// But they're more complex and slower. This is good enough for us!
  List<LatLng> optimizeRoute(LatLng startPoint, List<LatLng> points) {
    // Edge case: No deliveries? Just return starting point
    if (points.isEmpty) {
      debugPrint('⚠️ No points to optimize, returning start point only');
      return [startPoint];
    }

    // SETUP
    final optimizedRoute = <LatLng>[startPoint]; // Start here
    final remainingPoints = List<LatLng>.from(points); // Copy list so we can modify it
    var currentPoint = startPoint; // Where we are now

    final distance = const Distance(); // Tool to calculate distances

    debugPrint('🔄 Optimizing route for ${points.length} delivery points...');

    // MAIN LOOP: Keep going until we've visited everyone
    while (remainingPoints.isNotEmpty) {
      // Find the closest unvisited customer
      var nearestPoint = remainingPoints.first; // Start with first one
      var nearestDistance = distance.as(
        LengthUnit.Meter,
        currentPoint,
        nearestPoint,
      );

      // Check if any other customer is closer
      for (final point in remainingPoints) {
        final dist = distance.as(LengthUnit.Meter, currentPoint, point);
        if (dist < nearestDistance) {
          // Found someone closer!
          nearestDistance = dist;
          nearestPoint = point;
        }
      }

      // Visit the nearest customer
      optimizedRoute.add(nearestPoint); // Add to route
      remainingPoints.remove(nearestPoint); // Mark as visited
      currentPoint = nearestPoint; // We're now at this location

      // Loop continues with remaining customers...
    }

    debugPrint('✅ Route optimized: ${optimizedRoute.length} points total');
    return optimizedRoute;
  }

  // ==========================================================================
  // PRIVATE METHOD - CALCULATE TOTAL DISTANCE
  // ==========================================================================

  /// Add up distances between all consecutive waypoints
  ///
  /// WHAT THIS DOES:
  /// Given route [A, B, C, D], calculates:
  /// Total = distance(A→B) + distance(B→C) + distance(C→D)
  ///
  /// USES HAVERSINE FORMULA:
  /// Calculates "as the crow flies" distance on Earth's curved surface.
  /// More accurate than simple straight line in 2D.
  ///
  /// WHY NOT ROAD DISTANCE?
  /// That requires API call. This is just for estimates.
  double _calculateTotalDistance(List<LatLng> waypoints) {
    // Need at least 2 points to have distance
    if (waypoints.length < 2) return 0.0;

    double totalDistance = 0.0;
    final distance = const Distance(); // Haversine calculator

    // Loop through consecutive pairs: (point[0], point[1]), (point[1], point[2]), ...
    for (int i = 0; i < waypoints.length - 1; i++) {
      totalDistance += distance.as(
        LengthUnit.Meter,
        waypoints[i],
        waypoints[i + 1],
      );
    }

    return totalDistance;
  }

  // ==========================================================================
  // PRIVATE METHOD - VALIDATE INPUT
  // ==========================================================================

  /// Check if waypoints are valid before using them
  ///
  /// WHAT CAN GO WRONG:
  /// 1. Too few points (need at least 2 for a route!)
  /// 2. Invalid latitude (must be between -90 and 90)
  ///    - 0° = Equator
  ///    - 90° = North Pole
  ///    - -90° = South Pole
  /// 3. Invalid longitude (must be between -180 and 180)
  ///    - 0° = Prime Meridian (Greenwich, UK)
  ///    - 180° = Opposite side of Earth
  ///
  /// WHY VALIDATE:
  /// - Prevent crashes from bad data
  /// - Catch bugs early
  /// - Give helpful error messages
  bool _validateWaypoints(List<LatLng> waypoints) {
    // CHECK 1: Need at least 2 points
    // WHY: Can't make a route with just 1 point!
    if (waypoints.length < 2) {
      debugPrint('❌ Validation failed: Need at least 2 waypoints');
      return false;
    }

    // CHECK 2: Validate each coordinate
    for (int i = 0; i < waypoints.length; i++) {
      final point = waypoints[i];

      // Check latitude is valid (-90 to 90)
      if (point.latitude < -90 || point.latitude > 90) {
        debugPrint(
          '❌ Validation failed: Invalid latitude ${point.latitude} at waypoint $i',
        );
        debugPrint('   (Latitude must be between -90 and 90)');
        return false;
      }

      // Check longitude is valid (-180 to 180)
      if (point.longitude < -180 || point.longitude > 180) {
        debugPrint(
          '❌ Validation failed: Invalid longitude ${point.longitude} at waypoint $i',
        );
        debugPrint('   (Longitude must be between -180 and 180)');
        return false;
      }
    }

    // All checks passed!
    return true;
  }
}
