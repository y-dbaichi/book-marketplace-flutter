// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Order Map Marker Widget
///
/// Reusable component for displaying order markers on maps.
/// Provides consistent visual styling across all map views.
///
/// **Single Responsibility:** Display a map marker with quantity badge
///
/// **Features:**
/// - Selection-based styling (blue/red color, size changes)
/// - Quantity badge overlay
/// - Tap handling
/// - Configurable appearance
///
/// **Usage:**
/// ```dart
/// // In flutter_map MarkerLayer
/// Marker(
///   point: LatLng(lat, lng),
///   width: 50.0,
///   height: 50.0,
///   child: OrderMapMarker(
///     quantity: order.quantity,
///     isSelected: selectedOrderId == order.id,
///     onTap: () => _selectOrder(order),
///   ),
/// )
/// ```
library;

import 'package:flutter/material.dart';

/// Reusable map marker widget for orders
///
/// Single responsibility: Display a location pin with quantity badge
class OrderMapMarker extends StatelessWidget {
  /// Quantity to display in the badge
  final int quantity;

  /// Whether this marker is currently selected
  final bool isSelected;

  /// Callback when marker is tapped
  final VoidCallback? onTap;

  const OrderMapMarker({
    super.key,
    required this.quantity,
    this.isSelected = false,
    this.onTap,
  });

  // ---------------------------------------------------------------------------
  // CONSTANTS
  // ---------------------------------------------------------------------------

  /// Icon size for selected marker
  static const double _selectedIconSize = 50.0;

  /// Icon size for normal (unselected) marker
  static const double _normalIconSize = 40.0;

  /// Quantity badge padding
  static const double _badgePadding = 2.0;

  /// Quantity badge font size (selected)
  static const double _selectedBadgeFontSize = 12.0;

  /// Quantity badge font size (normal)
  static const double _normalBadgeFontSize = 10.0;

  /// Quantity badge vertical position (selected marker)
  static const double _selectedBadgeTop = 6.0;

  /// Quantity badge vertical position (normal marker)
  static const double _normalBadgeTop = 8.0;

  // ---------------------------------------------------------------------------
  // BUILD METHOD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Location pin icon (color and size based on selection)
          Icon(
            Icons.location_on,
            size: isSelected ? _selectedIconSize : _normalIconSize,
            color: isSelected ? Colors.red : Colors.blue,
          ),

          // Quantity badge (white circle with black text)
          Positioned(
            top: isSelected ? _selectedBadgeTop : _normalBadgeTop,
            child: Container(
              padding: const EdgeInsets.all(_badgePadding),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Text(
                quantity.toString(),
                style: TextStyle(
                  fontSize: isSelected
                      ? _selectedBadgeFontSize
                      : _normalBadgeFontSize,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
