// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Route Calculation Business Logic Helper
///
/// Centralized business logic for route calculations and formatting.
/// Follows Single Responsibility Principle by handling only route-related logic.
///
/// **Responsibilities:**
/// - Format distances for display
/// - Format durations for display
/// - Calculate simple distances (Haversine)
/// - Parse route data from API
/// - Extract turn-by-turn instructions
///
/// **Does NOT:**
/// - Make API calls (that's RouteService's job)
/// - Render UI (that's widgets' job)
/// - Optimize routes (that's RouteService's job)
///
/// **Usage:**
/// ```dart
/// final formatted = RouteHelper.formatDistance(5432.5); // "5.4 km"
/// final duration = RouteHelper.formatDuration(3725); // "62 min"
/// final icon = RouteHelper.getInstructionIcon(1); // Icons.turn_right
/// ```
library;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

/// Route calculation and formatting helper
///
/// Single responsibility: Route calculations and display formatting
class RouteHelper {
  // Private constructor to prevent instantiation
  RouteHelper._();

  // ==========================================================================
  // DISTANCE FORMATTING
  // ==========================================================================

  /// Format distance in meters to human-readable string
  ///
  /// Rules:
  /// - >= 1000m: Display in km (e.g., "5.4 km")
  /// - < 1000m: Display in m (e.g., "543 m")
  ///
  /// Parameters:
  /// - [distanceInMeters]: Distance in meters (can be int or double)
  ///
  /// Returns:
  /// Formatted string with unit
  static String formatDistance(dynamic distanceInMeters) {
    final meters = (distanceInMeters is int)
        ? distanceInMeters.toDouble()
        : distanceInMeters as double;

    if (meters >= 1000) {
      return '${(meters / 1000).toStringAsFixed(1)} km';
    } else {
      return '${meters.toStringAsFixed(0)} m';
    }
  }

  /// Format total distance with emoji
  ///
  /// Returns formatted string like "📏 12.5 km"
  static String formatDistanceWithEmoji(double distanceInMeters) {
    return '📏 ${formatDistance(distanceInMeters)}';
  }

  // ==========================================================================
  // DURATION FORMATTING
  // ==========================================================================

  /// Format duration in seconds to human-readable string
  ///
  /// Rules:
  /// - >= 60s: Display in minutes (e.g., "25 min")
  /// - Hours included if >= 60 min (e.g., "1h 25min")
  ///
  /// Parameters:
  /// - [durationInSeconds]: Duration in seconds
  ///
  /// Returns:
  /// Formatted string with unit
  static String formatDuration(double durationInSeconds) {
    final minutes = (durationInSeconds / 60).round();

    if (minutes >= 60) {
      final hours = minutes ~/ 60;
      final remainingMinutes = minutes % 60;
      if (remainingMinutes > 0) {
        return '${hours}h ${remainingMinutes}min';
      } else {
        return '${hours}h';
      }
    } else {
      return '$minutes min';
    }
  }

  /// Format duration with emoji
  ///
  /// Returns formatted string like "⏱️ 25 min"
  static String formatDurationWithEmoji(double durationInSeconds) {
    return '⏱️ ${formatDuration(durationInSeconds)}';
  }

  /// Format route info (distance + duration)
  ///
  /// Returns formatted string like "📏 12.5 km • ⏱️ 25 min"
  static String formatRouteInfo(double distanceInMeters, double durationInSeconds) {
    return '${formatDistanceWithEmoji(distanceInMeters)} • ${formatDurationWithEmoji(durationInSeconds)}';
  }

  // ==========================================================================
  // DISTANCE CALCULATION
  // ==========================================================================

  /// Calculate distance between two points using Haversine formula
  ///
  /// Returns distance in meters
  static double calculateDistance(LatLng point1, LatLng point2) {
    const Distance distance = Distance();
    return distance.as(LengthUnit.Meter, point1, point2);
  }

  /// Calculate total distance for a route
  ///
  /// Sums distances between consecutive points
  ///
  /// Returns total distance in meters
  static double calculateTotalDistance(List<LatLng> points) {
    if (points.length < 2) return 0;

    double total = 0;
    for (int i = 0; i < points.length - 1; i++) {
      total += calculateDistance(points[i], points[i + 1]);
    }
    return total;
  }

  // ==========================================================================
  // DURATION ESTIMATION
  // ==========================================================================

  /// Estimate duration based on distance
  ///
  /// Uses average speed to estimate travel time
  ///
  /// Parameters:
  /// - [distanceInMeters]: Total distance in meters
  /// - [averageSpeedKmh]: Average speed in km/h (default: 40 km/h)
  ///
  /// Returns duration in seconds
  static double estimateDuration(
    double distanceInMeters, {
    double averageSpeedKmh = 40.0,
  }) {
    final distanceInKm = distanceInMeters / 1000;
    final hours = distanceInKm / averageSpeedKmh;
    return hours * 3600; // Convert to seconds
  }

  // ==========================================================================
  // TURN-BY-TURN INSTRUCTIONS
  // ==========================================================================

  /// Get icon for turn-by-turn instruction type
  ///
  /// OpenRouteService instruction types:
  /// - 0: Straight
  /// - 1: Right
  /// - 2: Left
  /// - 3: Sharp right
  /// - 4: Sharp left
  /// - 5: Slight right
  /// - 6: Slight left
  /// - 7: Continue
  /// - 10: Depart
  /// - 11: Arrive
  /// - 12: U-turn
  static IconData getInstructionIcon(int type) {
    switch (type) {
      case 0:
        return Icons.arrow_upward; // Straight
      case 1:
        return Icons.turn_right; // Right
      case 2:
        return Icons.turn_left; // Left
      case 3:
        return Icons.turn_sharp_right; // Sharp right
      case 4:
        return Icons.turn_sharp_left; // Sharp left
      case 5:
        return Icons.turn_slight_right; // Slight right
      case 6:
        return Icons.turn_slight_left; // Slight left
      case 7:
        return Icons.arrow_upward; // Continue
      case 10:
        return Icons.flag; // Depart
      case 11:
        return Icons.place; // Arrive
      case 12:
        return Icons.u_turn_left; // U-turn
      default:
        return Icons.navigation;
    }
  }

  /// Get color for turn-by-turn instruction type
  ///
  /// Color coding:
  /// - Start (10): Green
  /// - End (11): Red
  /// - Right turns (1, 3): Orange
  /// - Left turns (2, 4): Blue
  /// - Default: Indigo
  static Color getInstructionColor(int type) {
    switch (type) {
      case 10:
        return Colors.green; // Start
      case 11:
        return Colors.red; // End
      case 1:
      case 3:
        return Colors.orange; // Right turns
      case 2:
      case 4:
        return Colors.blue; // Left turns
      default:
        return Colors.indigo;
    }
  }

  /// Extract turn-by-turn instructions from route data
  ///
  /// Parses OpenRouteService API response
  ///
  /// Returns list of instruction maps, or empty list if not found
  static List<Map<String, dynamic>> extractInstructions(
    Map<String, dynamic> routeData,
  ) {
    try {
      if (!routeData.containsKey('features')) return [];

      final features = routeData['features'] as List;
      if (features.isEmpty) return [];

      final properties = features[0]['properties'];
      if (properties == null) return [];

      final segments = properties['segments'];
      if (segments == null || segments is! List || segments.isEmpty) return [];

      final steps = segments[0]['steps'];
      if (steps == null || steps is! List) return [];

      return steps.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  // ==========================================================================
  // ROUTE DATA PARSING
  // ==========================================================================

  /// Parse route points from API response
  ///
  /// Extracts LineString coordinates from GeoJSON
  ///
  /// Returns list of LatLng points, or empty list if invalid
  static List<LatLng> parseRoutePoints(Map<String, dynamic> routeData) {
    try {
      if (!routeData.containsKey('features')) return [];

      final features = routeData['features'] as List;
      if (features.isEmpty) return [];

      final geometry = features[0]['geometry'];
      if (geometry == null || geometry['type'] != 'LineString') return [];

      final coordinates = geometry['coordinates'] as List;
      return coordinates
          .map((coord) => LatLng(coord[1], coord[0])) // [lon, lat] → LatLng(lat, lon)
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Parse route summary from API response
  ///
  /// Extracts distance and duration
  ///
  /// Returns map with 'distance' and 'duration' keys, or null if invalid
  static Map<String, double>? parseRouteSummary(Map<String, dynamic> routeData) {
    try {
      if (!routeData.containsKey('features')) return null;

      final features = routeData['features'] as List;
      if (features.isEmpty) return null;

      final properties = features[0]['properties'];
      final summary = properties?['summary'];
      if (summary == null) return null;

      return {
        'distance': (summary['distance'] ?? 0).toDouble(),
        'duration': (summary['duration'] ?? 0).toDouble(),
      };
    } catch (e) {
      return null;
    }
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /// Check if route data is valid
  ///
  /// Returns true if route data contains required fields
  static bool isValidRouteData(Map<String, dynamic> routeData) {
    return routeData.containsKey('features') &&
        routeData['features'] is List &&
        (routeData['features'] as List).isNotEmpty;
  }
}
