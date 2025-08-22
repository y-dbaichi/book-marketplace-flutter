import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class RouteService {
  static const String _baseUrl = 'https://api.openrouteservice.org/v2';
  static const String _apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBmYmNiMTA0ZjlhODQ4YjZiNWVmNWJjM2FiODZmZTU0IiwiaCI6Im11cm11cjY0In0=';

  // Now using real OpenRouteService API
  static const bool _useMockData = false;

  Future<Map<String, dynamic>?> getRoute(List<LatLng> waypoints) async {
    if (_useMockData) {
      print('🔄 Using mock routing data (no API key provided)');
      return _getMockRoute(waypoints);
    }

    if (waypoints.length < 2) {
      print('❌ Need at least 2 waypoints for routing');
      return null;
    }

    try {
      print('🌐 Calling OpenRouteService API with ${waypoints.length} waypoints...');

      // For 2 points, use simple GET request
      if (waypoints.length == 2) {
        return await _getSimpleRoute(waypoints[0], waypoints[1]);
      } else {
        // For multiple waypoints, use POST request
        return await _getMultiWaypointRoute(waypoints);
      }
    } catch (e) {
      print('❌ Route service error: $e');
      print('🔄 Falling back to mock data');
      return _getMockRoute(waypoints);
    }
  }

  // Simple GET request for 2 points (like the example you showed)
  Future<Map<String, dynamic>?> _getSimpleRoute(LatLng start, LatLng end) async {
    try {
      final url = '$_baseUrl/directions/driving-car'
          '?api_key=$_apiKey'
          '&start=${start.longitude},${start.latitude}'
          '&end=${end.longitude},${end.latitude}';

      print('📡 GET Request: $url');

      final response = await http.get(Uri.parse(url));

      print('📡 ORS Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Real route data received from OpenRouteService (GET)');
        return data;
      } else {
        print('❌ ORS GET API Error: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ GET Route error: $e');
      return null;
    }
  }

  // POST request for multiple waypoints
  Future<Map<String, dynamic>?> _getMultiWaypointRoute(List<LatLng> waypoints) async {
    try {
      // Prepare coordinates for ORS API (longitude, latitude format)
      List<List<double>> coordinates = waypoints
          .map((point) => [point.longitude, point.latitude])
          .toList();

      print('📍 Route coordinates: ${coordinates.length} waypoints');

      final response = await http.post(
        Uri.parse('$_baseUrl/directions/driving-car/geojson'),
        headers: {
          'Authorization': _apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json',
        },
        body: jsonEncode({
          'coordinates': coordinates,
          'instructions': true,
          'geometry': true,
          'preference': 'fastest',
          'units': 'km',
        }),
      );

      print('📡 ORS Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Real route data received from OpenRouteService (POST)');
        return data;
      } else {
        print('❌ ORS POST API Error: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ POST Route error: $e');
      return null;
    }
  }

  // Mock route for demo purposes - creates realistic curved paths
  Map<String, dynamic> _getMockRoute(List<LatLng> waypoints) {
    if (waypoints.isEmpty) return _getEmptyRoute();

    List<List<double>> coordinates = [];

    for (int i = 0; i < waypoints.length; i++) {
      coordinates.add([waypoints[i].longitude, waypoints[i].latitude]);

      // Add curved intermediate points for more realistic routes
      if (i < waypoints.length - 1) {
        LatLng current = waypoints[i];
        LatLng next = waypoints[i + 1];

        // Create 3 intermediate points with slight curve
        for (int j = 1; j <= 3; j++) {
          double ratio = j / 4.0;
          double lat = current.latitude + (next.latitude - current.latitude) * ratio;
          double lng = current.longitude + (next.longitude - current.longitude) * ratio;

          // Add slight curve (simulate road curvature)
          double curveFactor = 0.001 * (j == 2 ? 1 : 0.5); // Peak curve in middle
          lat += curveFactor * (j % 2 == 0 ? 1 : -1);
          lng += curveFactor * (j % 2 == 0 ? -1 : 1);

          coordinates.add([lng, lat]);
        }
      }
    }

    final distance = _calculateTotalDistance(waypoints);
    final duration = distance * 0.06; // ~60 km/h average speed

    return {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'summary': {
              'distance': distance,
              'duration': duration,
            },
            'segments': [
              {
                'distance': distance,
                'duration': duration,
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

  Map<String, dynamic> _getEmptyRoute() {
    return {
      'type': 'FeatureCollection',
      'features': []
    };
  }

  List<Map<String, dynamic>> _generateMockInstructions(List<LatLng> waypoints) {
    List<Map<String, dynamic>> instructions = [];

    for (int i = 0; i < waypoints.length; i++) {
      if (i == 0) {
        instructions.add({
          'instruction': 'Départ du point de départ',
          'distance': 0.0,
          'duration': 0.0,
          'type': 10, // Depart
        });
      } else if (i == waypoints.length - 1) {
        instructions.add({
          'instruction': 'Arrivée à destination',
          'distance': 0.0,
          'duration': 0.0,
          'type': 10, // Arrive
        });
      } else {
        instructions.add({
          'instruction': 'Continuer vers le point ${i + 1}',
          'distance': _calculateDistance(waypoints[i - 1], waypoints[i]),
          'duration': _calculateDistance(waypoints[i - 1], waypoints[i]) * 0.06,
          'type': 0, // Continue
        });
      }
    }

    return instructions;
  }

  double _calculateTotalDistance(List<LatLng> waypoints) {
    double totalDistance = 0;
    final Distance distance = Distance();

    for (int i = 0; i < waypoints.length - 1; i++) {
      totalDistance += distance.as(LengthUnit.Meter, waypoints[i], waypoints[i + 1]);
    }

    return totalDistance;
  }

  double _calculateDistance(LatLng point1, LatLng point2) {
    final Distance distance = Distance();
    return distance.as(LengthUnit.Meter, point1, point2);
  }

  // Simple nearest neighbor algorithm for ordering points
  List<LatLng> optimizeRoute(LatLng startPoint, List<LatLng> points) {
    if (points.isEmpty) return [startPoint];
    
    List<LatLng> optimizedRoute = [startPoint];
    List<LatLng> remainingPoints = List.from(points);
    LatLng currentPoint = startPoint;
    
    final Distance distance = Distance();
    
    while (remainingPoints.isNotEmpty) {
      // Find nearest point to current position
      LatLng nearestPoint = remainingPoints.first;
      double nearestDistance = distance.as(LengthUnit.Meter, currentPoint, nearestPoint);
      
      for (LatLng point in remainingPoints) {
        double dist = distance.as(LengthUnit.Meter, currentPoint, point);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPoint = point;
        }
      }
      
      optimizedRoute.add(nearestPoint);
      remainingPoints.remove(nearestPoint);
      currentPoint = nearestPoint;
    }
    
    return optimizedRoute;
  }
}
