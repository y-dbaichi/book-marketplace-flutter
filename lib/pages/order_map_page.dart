// ==============================================================================
// ORDER MAP PAGE
// ==============================================================================
// Interactive map view showing delivery points for confirmed orders
// Displays all delivery locations with interactive markers
//
// Features:
// - Interactive map powered by flutter_map and OpenStreetMap
// - Custom markers for each delivery point
// - Marker selection with auto-zoom
// - Order details in bottom sheet
// - Quantity badges on markers
// - Color-coded selection state
// - Map legend
// - Responsive design
//
// Architecture:
// - StatefulWidget for marker selection state
// - MapController for programmatic map control
// - OpenStreetMap tile layer (no API key required)
// - GestureDetector for marker tap handling
// - Positioned widgets for layered UI
//
// Map Controls:
// - Tap marker to select and zoom
// - Pinch to zoom
// - Drag to pan
// - Auto-center on first order
//
// Data Flow:
// 1. Receive List<Order> from parent (SellerOrdersPage)
// 2. Filter orders with buyerLocation != null
// 3. Build markers for each location
// 4. Handle marker selection
// 5. Show order details in bottom sheet
//
// External Dependencies:
// - flutter_map: ^6.0.0 - Map rendering
// - latlong2: ^0.9.0 - Latitude/longitude data types
// - OpenStreetMap tiles - Free tile server
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/order.dart';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/// Marker width for delivery points
const double _kMarkerWidth = 50.0;

/// Marker height for delivery points
const double _kMarkerHeight = 50.0;

/// Icon size for selected marker
const double _kSelectedIconSize = 50.0;

/// Icon size for normal (unselected) marker
const double _kNormalIconSize = 40.0;

/// Quantity badge padding
const double _kBadgePadding = 2.0;

/// Quantity badge font size (selected)
const double _kSelectedBadgeFontSize = 12.0;

/// Quantity badge font size (normal)
const double _kNormalBadgeFontSize = 10.0;

/// Quantity badge vertical position (selected marker)
const double _kSelectedBadgeTop = 6.0;

/// Quantity badge vertical position (normal marker)
const double _kNormalBadgeTop = 8.0;

/// Bottom sheet padding
const double _kBottomSheetPadding = 16.0;

/// Bottom sheet border radius
const double _kBottomSheetBorderRadius = 16.0;

/// Legend card padding
const double _kLegendPadding = 12.0;

/// Legend top position
const double _kLegendTop = 16.0;

/// Legend right position
const double _kLegendRight = 16.0;

/// Info row icon size
const double _kInfoIconSize = 16.0;

/// Info row vertical padding
const double _kInfoRowPadding = 4.0;

/// Space between legend items
const double _kLegendItemSpacing = 4.0;

/// Space between icon and text in legend
const double _kLegendIconSpacing = 4.0;

/// Space between major sections
const double _kMajorSpacing = 8.0;

/// Legend icon size
const double _kLegendIconSize = 20.0;

/// Default map zoom level (city view)
const double _kDefaultZoom = 12.0;

/// Zoom level when marker is selected (street view)
const double _kSelectedZoom = 14.0;

/// Minimum zoom level (country view)
const double _kMinZoom = 5.0;

/// Maximum zoom level (building view)
const double _kMaxZoom = 18.0;

/// Casablanca coordinates (default center if no orders)
/// Latitude: 33.5731° N
/// Longitude: 7.5898° W
const double _kDefaultLatitude = 33.5731;
const double _kDefaultLongitude = -7.5898;

// ==============================================================================
// ORDER MAP PAGE WIDGET
// ==============================================================================

/// Interactive map showing delivery points for confirmed orders
///
/// This page displays all confirmed orders on an interactive map using
/// OpenStreetMap tiles. Each delivery location is marked with a pin
/// showing the order quantity. Tapping a marker shows order details.
///
/// Usage:
/// ```dart
/// final confirmedOrders = orders.where((o) => o.isConfirmed).toList();
/// Navigator.push(
///   context,
///   MaterialPageRoute(
///     builder: (_) => OrderMapPage(orders: confirmedOrders),
///   ),
/// );
/// ```
class OrderMapPage extends StatefulWidget {
  /// List of orders to display on the map
  ///
  /// Should contain only confirmed orders with delivery locations.
  /// Orders without buyerLocation will be filtered out.
  final List<Order> orders;

  const OrderMapPage({super.key, required this.orders});

  @override
  State<OrderMapPage> createState() => _OrderMapPageState();
}

// ==============================================================================
// ORDER MAP PAGE STATE
// ==============================================================================

/// Private state class for OrderMapPage
///
/// Manages:
/// - Map controller for programmatic control
/// - Selected order for details display
class _OrderMapPageState extends State<OrderMapPage> {
  // ---------------------------------------------------------------------------
  // STATE VARIABLES
  // ---------------------------------------------------------------------------

  /// Map controller for programmatic map manipulation
  ///
  /// Used to:
  /// - Move map to specific coordinates
  /// - Zoom in/out programmatically
  /// - Get current map position
  final MapController _mapController = MapController();

  /// Currently selected order (null if none selected)
  ///
  /// When an order is selected:
  /// - Map zooms to marker location
  /// - Bottom sheet shows order details
  /// - Marker turns red
  Order? _selectedOrder;

  // ---------------------------------------------------------------------------
  // LIFECYCLE METHODS
  // ---------------------------------------------------------------------------

  /// Initialize state and center map on first order
  ///
  /// Uses WidgetsBinding.instance.addPostFrameCallback to ensure
  /// the map is fully rendered before moving it. This prevents
  /// errors that occur when trying to control a map that hasn't
  /// finished initializing.
  @override
  void initState() {
    super.initState();

    // Center map on first order after build completes
    if (widget.orders.isNotEmpty && widget.orders.first.buyerLocation != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final loc = widget.orders.first.buyerLocation!;
        _mapController.move(
          LatLng(loc.latitude, loc.longitude),
          _kDefaultZoom,
        );
      });
    }
  }

  // ---------------------------------------------------------------------------
  // MARKER BUILDING
  // ---------------------------------------------------------------------------

  /// Build markers for all orders with locations
  ///
  /// Creates an interactive marker for each order that has a buyerLocation.
  /// Each marker:
  /// - Shows a location pin icon
  /// - Displays quantity in a circular badge
  /// - Changes color when selected (blue → red)
  /// - Changes size when selected (40 → 50)
  /// - Responds to taps by selecting the order and zooming
  ///
  /// Returns:
  /// List of Marker widgets for flutter_map MarkerLayer
  List<Marker> _buildMarkers() {
    return widget.orders
        .where((order) => order.buyerLocation != null)
        .map((order) {
      final loc = order.buyerLocation!;
      final isSelected = _selectedOrder?.id == order.id;

      return Marker(
        // Marker position from order's buyer location
        point: LatLng(loc.latitude, loc.longitude),
        width: _kMarkerWidth,
        height: _kMarkerHeight,

        // Marker widget with tap handler
        child: GestureDetector(
          onTap: () {
            // Select order and zoom to marker
            setState(() => _selectedOrder = order);
            _mapController.move(
              LatLng(loc.latitude, loc.longitude),
              _kSelectedZoom,
            );
          },

          // Marker visual: pin icon with quantity badge
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Location pin icon (color and size based on selection)
              Icon(
                Icons.location_on,
                size: isSelected ? _kSelectedIconSize : _kNormalIconSize,
                color: isSelected ? Colors.red : Colors.blue,
              ),

              // Quantity badge (white circle with black text)
              Positioned(
                top: isSelected ? _kSelectedBadgeTop : _kNormalBadgeTop,
                child: Container(
                  padding: const EdgeInsets.all(_kBadgePadding),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    order.quantity.toString(),
                    style: TextStyle(
                      fontSize: isSelected
                          ? _kSelectedBadgeFontSize
                          : _kNormalBadgeFontSize,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  // ---------------------------------------------------------------------------
  // BUILD METHOD
  // ---------------------------------------------------------------------------

  /// Build the map page UI
  ///
  /// Layout structure:
  /// - Full-screen map (FlutterMap)
  /// - Bottom sheet with order details (when order selected)
  /// - Legend card at top-right
  ///
  /// The map uses OpenStreetMap tiles which are free and don't
  /// require an API key. The user agent is set for compliance
  /// with OSM tile usage policy.
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Carte de livraison (${widget.orders.length} points)'),
      ),
      body: Stack(
        children: [
          // ====================================================================
          // MAP LAYER
          // ====================================================================
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              // Initial center: first order location or Casablanca
              initialCenter: widget.orders.isNotEmpty &&
                      widget.orders.first.buyerLocation != null
                  ? LatLng(
                      widget.orders.first.buyerLocation!.latitude,
                      widget.orders.first.buyerLocation!.longitude,
                    )
                  : const LatLng(_kDefaultLatitude, _kDefaultLongitude),

              // Zoom configuration
              initialZoom: _kDefaultZoom,
              minZoom: _kMinZoom,
              maxZoom: _kMaxZoom,
            ),
            children: [
              // OpenStreetMap tile layer
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.book_delivery',
              ),

              // Marker layer with delivery points
              MarkerLayer(markers: _buildMarkers()),
            ],
          ),

          // ====================================================================
          // BOTTOM SHEET (Order Details)
          // ====================================================================
          if (_selectedOrder != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Card(
                margin: EdgeInsets.zero,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(_kBottomSheetBorderRadius),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(_kBottomSheetPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header: Book title and close button
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Book title
                                Text(
                                  _selectedOrder!.book.title,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                // Book author
                                Text(
                                  'Par ${_selectedOrder!.book.author}',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                          // Close button
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () =>
                                setState(() => _selectedOrder = null),
                          ),
                        ],
                      ),

                      const Divider(),

                      // Order details
                      _buildInfoRow(
                        Icons.person,
                        'Client',
                        _selectedOrder!.buyerName,
                      ),
                      _buildInfoRow(
                        Icons.phone,
                        'Téléphone',
                        _selectedOrder!.buyer.phone ?? 'N/A',
                      ),
                      _buildInfoRow(
                        Icons.location_on,
                        'Adresse',
                        _selectedOrder!.buyerLocation?.address ?? 'N/A',
                      ),
                      _buildInfoRow(
                        Icons.numbers,
                        'Quantité',
                        _selectedOrder!.quantity.toString(),
                      ),
                      _buildInfoRow(
                        Icons.attach_money,
                        'Prix',
                        '${_selectedOrder!.totalPrice.toStringAsFixed(2)} MAD',
                      ),

                      // Buyer notes (if present)
                      if (_selectedOrder!.buyerNotes != null) ...[
                        const Divider(),
                        Text(
                          'Notes: ${_selectedOrder!.buyerNotes}',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

          // ====================================================================
          // LEGEND
          // ====================================================================
          Positioned(
            top: _kLegendTop,
            right: _kLegendRight,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(_kLegendPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Legend title
                    const Text(
                      'Légende',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: _kMajorSpacing),

                    // Delivery point (blue pin)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.location_on,
                          color: Colors.blue,
                          size: _kLegendIconSize,
                        ),
                        SizedBox(width: _kLegendIconSpacing),
                        Text('Point de livraison'),
                      ],
                    ),
                    const SizedBox(height: _kLegendItemSpacing),

                    // Selected point (red pin)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.location_on,
                          color: Colors.red,
                          size: _kLegendIconSize,
                        ),
                        SizedBox(width: _kLegendIconSpacing),
                        Text('Sélectionné'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER WIDGETS
  // ---------------------------------------------------------------------------

  /// Build an info row with icon, label, and value
  ///
  /// Creates a consistent layout for order details:
  /// [Icon] Label: Value
  ///
  /// Parameters:
  /// - [icon]: Icon to display before label
  /// - [label]: Label text (e.g., "Client", "Téléphone")
  /// - [value]: Value text (e.g., "John Doe", "0612345678")
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: _kInfoRowPadding),
      child: Row(
        children: [
          // Icon
          Icon(icon, size: _kInfoIconSize, color: Colors.grey[600]),
          const SizedBox(width: _kMajorSpacing),

          // Label
          Text('$label: ', style: TextStyle(color: Colors.grey[600])),

          // Value (expanded to take remaining space)
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
