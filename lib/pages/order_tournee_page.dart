import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/order.dart';
import '../services/route_service.dart';
import '../services/order_service.dart';

class OrderTourneePage extends StatefulWidget {
  final List<Order> orders;

  const OrderTourneePage({super.key, required this.orders});

  @override
  State<OrderTourneePage> createState() => _OrderTourneePageState();
}

class _OrderTourneePageState extends State<OrderTourneePage> {
  final MapController _mapController = MapController();
  final RouteService _routeService = RouteService();
  final OrderService _orderService = OrderService();

  LatLng? _startPoint;
  List<Order> _optimizedOrders = [];
  List<Polyline> _routeLines = [];
  bool _isLoadingRoute = false;
  bool _isGettingLocation = false;
  String _routeInfo = '';
  int? _selectedOrderIndex;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  void _initializeMap() {
    if (widget.orders.isNotEmpty && widget.orders.first.buyerLocation != null) {
      final firstLoc = widget.orders.first.buyerLocation!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(
          LatLng(firstLoc.latitude, firstLoc.longitude),
          12.0,
        );
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isGettingLocation = true);

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Permission de localisation refusée');
        }
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _startPoint = LatLng(position.latitude, position.longitude);
      });

      _mapController.move(_startPoint!, 14.0);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Position GPS définie comme point de départ'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Erreur GPS: $e')),
        );
      }
    } finally {
      setState(() => _isGettingLocation = false);
    }
  }

  void _setManualStartPoint(LatLng point) {
    setState(() {
      _startPoint = point;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📍 Point de départ défini (appuyez sur Calculer)'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  Future<void> _calculateRoute() async {
    if (_startPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Veuillez définir un point de départ (GPS ou clic sur la carte)'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoadingRoute = true);

    try {
      // Convert order locations to LatLng
      List<LatLng> deliveryPoints = widget.orders
          .where((o) => o.buyerLocation != null)
          .map((o) => LatLng(
                o.buyerLocation!.latitude,
                o.buyerLocation!.longitude,
              ))
          .toList();

      // Optimize route using nearest neighbor algorithm
      final optimizedPoints = _routeService.optimizeRoute(_startPoint!, deliveryPoints);

      // Reorder orders based on optimized route
      _optimizedOrders = _reorderOrdersByRoute(optimizedPoints);

      // Get route from OpenRouteService
      final routeData = await _routeService.getRoute(optimizedPoints);

      if (routeData != null) {
        _processRouteData(routeData);
      } else {
        // Fallback: draw simple lines
        _drawSimpleRoute(optimizedPoints);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Tournée optimisée: ${_optimizedOrders.length} livraisons'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Erreur: $e')),
        );
      }
    } finally {
      setState(() => _isLoadingRoute = false);
    }
  }

  List<Order> _reorderOrdersByRoute(List<LatLng> routePoints) {
    List<Order> reordered = [];

    // Skip first point (starting point) and match with orders
    for (int i = 1; i < routePoints.length; i++) {
      final routePoint = routePoints[i];

      // Find order matching this coordinate
      final order = widget.orders.firstWhere(
        (o) =>
            o.buyerLocation != null &&
            (o.buyerLocation!.latitude - routePoint.latitude).abs() < 0.0001 &&
            (o.buyerLocation!.longitude - routePoint.longitude).abs() < 0.0001,
        orElse: () => widget.orders.first,
      );

      if (!reordered.contains(order)) {
        reordered.add(order);
      }
    }

    return reordered;
  }

  void _drawSimpleRoute(List<LatLng> points) {
    setState(() {
      _routeLines = [
        Polyline(
          points: points,
          strokeWidth: 4.0,
          color: Colors.blue,
          borderColor: Colors.white,
          borderStrokeWidth: 2.0,
        ),
      ];
    });

    _fitMapToRoute(points);

    // Calculate simple distance
    double totalDistance = 0;
    for (int i = 0; i < points.length - 1; i++) {
      totalDistance += _calculateDistance(points[i], points[i + 1]);
    }

    setState(() {
      _routeInfo = 'Distance estimée: ${(totalDistance / 1000).toStringAsFixed(1)} km';
    });
  }

  double _calculateDistance(LatLng p1, LatLng p2) {
    const Distance distance = Distance();
    return distance.as(LengthUnit.Meter, p1, p2);
  }

  void _processRouteData(Map<String, dynamic> routeData) {
    try {
      List<LatLng> routePoints = [];
      double? distance;
      double? duration;

      if (routeData.containsKey('features')) {
        final features = routeData['features'] as List;
        if (features.isNotEmpty) {
          final geometry = features[0]['geometry'];
          final properties = features[0]['properties'];

          if (geometry['type'] == 'LineString') {
            final coordinates = geometry['coordinates'] as List;
            routePoints = coordinates
                .map((coord) => LatLng(coord[1], coord[0]))
                .toList();
          }

          final summary = properties?['summary'];
          if (summary != null) {
            distance = summary['distance']?.toDouble();
            duration = summary['duration']?.toDouble();
          }
        }
      }

      if (routePoints.isNotEmpty) {
        setState(() {
          _routeLines = [
            Polyline(
              points: routePoints,
              strokeWidth: 4.0,
              color: Colors.blue,
              borderColor: Colors.white,
              borderStrokeWidth: 2.0,
            ),
          ];
        });

        // Calculate distance from route points
        double totalDistance = 0;
        for (int i = 0; i < routePoints.length - 1; i++) {
          totalDistance += _calculateDistance(routePoints[i], routePoints[i + 1]);
        }

        // Use calculated distance and API duration (accurate road-based estimates)
        final finalDistance = totalDistance;
        final finalDuration = (duration != null && duration > 0)
            ? duration
            : (totalDistance / 1000) / 40 * 3600; // Fallback: 40 km/h in seconds

        final distanceKm = (finalDistance / 1000).toStringAsFixed(1);
        final durationMin = (finalDuration / 60).toStringAsFixed(0);

        setState(() {
          _routeInfo = '📏 $distanceKm km • ⏱️ $durationMin min';
        });

        _fitMapToRoute(routePoints);
      }
    } catch (e) {
      print('❌ Error processing route: $e');
    }
  }

  void _fitMapToRoute(List<LatLng> points) {
    if (points.isEmpty) return;

    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (LatLng point in points) {
      minLat = minLat < point.latitude ? minLat : point.latitude;
      maxLat = maxLat > point.latitude ? maxLat : point.latitude;
      minLng = minLng < point.longitude ? minLng : point.longitude;
      maxLng = maxLng > point.longitude ? maxLng : point.longitude;
    }

    final bounds = LatLngBounds(
      LatLng(minLat, minLng),
      LatLng(maxLat, maxLng),
    );

    _mapController.fitCamera(
      CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)),
    );
  }

  List<Marker> _buildMarkers() {
    List<Marker> markers = [];

    // Start point marker
    if (_startPoint != null) {
      markers.add(
        Marker(
          point: _startPoint!,
          width: 50,
          height: 50,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Icon(
              Icons.play_arrow,
              color: Colors.white,
              size: 28,
            ),
          ),
        ),
      );
    }

    // Order markers
    final ordersToShow = _optimizedOrders.isNotEmpty ? _optimizedOrders : widget.orders;

    for (int i = 0; i < ordersToShow.length; i++) {
      final order = ordersToShow[i];
      if (order.buyerLocation == null) continue;

      final isSelected = _selectedOrderIndex == i;
      final loc = order.buyerLocation!;

      markers.add(
        Marker(
          point: LatLng(loc.latitude, loc.longitude),
          width: 50,
          height: 50,
          child: GestureDetector(
            onTap: () => _showOrderDetails(order, i),
            child: Container(
              decoration: BoxDecoration(
                color: isSelected ? Colors.orange : Colors.red,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  '${i + 1}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return markers;
  }

  void _showOrderDetails(Order order, int index) {
    setState(() => _selectedOrderIndex = index);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollController,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.book.title,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Par ${order.book.author}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      setState(() => _selectedOrderIndex = null);
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
              const Divider(height: 32),
              _buildDetailRow(Icons.person, 'Client', order.buyerName),
              _buildDetailRow(Icons.phone, 'Téléphone', order.buyer.phone ?? 'N/A'),
              _buildDetailRow(
                Icons.location_on,
                'Adresse',
                order.buyerLocation?.address ?? 'N/A',
              ),
              _buildDetailRow(Icons.shopping_bag, 'Quantité', order.quantity.toString()),
              _buildDetailRow(
                Icons.attach_money,
                'Prix',
                '${order.totalPrice.toStringAsFixed(2)} MAD',
              ),
              if (order.buyerNotes != null) ...[
                const Divider(height: 24),
                Text(
                  'Notes du client:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(order.buyerNotes!),
                ),
              ],
              const SizedBox(height: 24),
              // Navigation button (prominent)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _openNavigation(order),
                  icon: const Icon(Icons.navigation, size: 24),
                  label: const Text(
                    'Démarrer la navigation',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo[600],
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _callContact(order.buyer.phone ?? ''),
                      icon: const Icon(Icons.phone),
                      label: const Text('Appeler'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _markAsDelivered(order),
                      icon: const Icon(Icons.check_circle),
                      label: const Text('Livrée'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ).then((_) => setState(() => _selectedOrderIndex = null));
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _callContact(String phoneNumber) async {
    if (phoneNumber.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Numéro de téléphone non disponible')),
      );
      return;
    }

    final Uri phoneUri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'ouvrir l\'application téléphone')),
        );
      }
    }
  }

  Future<void> _openNavigation(Order order) async {
    if (order.buyerLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Localisation non disponible')),
      );
      return;
    }

    final lat = order.buyerLocation!.latitude;
    final lng = order.buyerLocation!.longitude;

    // Build Google Maps URL - include origin if available
    final StringBuffer urlBuffer = StringBuffer();
    urlBuffer.write('https://www.google.com/maps/dir/?api=1');

    // Add origin (starting point) if set
    if (_startPoint != null) {
      urlBuffer.write('&origin=${_startPoint!.latitude},${_startPoint!.longitude}');
    }

    // Add destination
    urlBuffer.write('&destination=$lat,$lng');
    urlBuffer.write('&travelmode=driving');

    final String url = urlBuffer.toString();
    final Uri googleMapsUri = Uri.parse(url);

    try {
      if (await canLaunchUrl(googleMapsUri)) {
        await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Cannot launch navigation');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Impossible d\'ouvrir la navigation'),
          ),
        );
      }
    }
  }

  Future<void> _openFullRouteNavigation() async {
    if (_startPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez d\'abord calculer la tournée'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final ordersToNavigate = _optimizedOrders.isNotEmpty ? _optimizedOrders : widget.orders;

    if (ordersToNavigate.isEmpty) {
      return;
    }

    // Build Google Maps URL with multiple waypoints
    final StringBuffer urlBuffer = StringBuffer();
    urlBuffer.write('https://www.google.com/maps/dir/?api=1');

    // Origin (starting point)
    urlBuffer.write('&origin=${_startPoint!.latitude},${_startPoint!.longitude}');

    // Waypoints (all deliveries except the last one)
    if (ordersToNavigate.length > 1) {
      urlBuffer.write('&waypoints=');
      for (int i = 0; i < ordersToNavigate.length - 1; i++) {
        final loc = ordersToNavigate[i].buyerLocation;
        if (loc != null) {
          if (i > 0) urlBuffer.write('|');
          urlBuffer.write('${loc.latitude},${loc.longitude}');
        }
      }
    }

    // Destination (last delivery)
    final lastLoc = ordersToNavigate.last.buyerLocation;
    if (lastLoc != null) {
      urlBuffer.write('&destination=${lastLoc.latitude},${lastLoc.longitude}');
    }

    urlBuffer.write('&travelmode=driving');

    final Uri googleMapsUri = Uri.parse(urlBuffer.toString());

    try {
      if (await canLaunchUrl(googleMapsUri)) {
        await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Cannot launch navigation');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Impossible d\'ouvrir la navigation'),
          ),
        );
      }
    }
  }

  Future<void> _markAsDelivered(Order order) async {
    Navigator.pop(context); // Close bottom sheet

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la livraison'),
        content: Text('Marquer "${order.book.title}" comme livrée ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _orderService.markAsDelivered(order.id);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✅ ${order.book.title} marquée comme livrée'),
              backgroundColor: Colors.green,
            ),
          );

          // Remove from current route
          setState(() {
            widget.orders.remove(order);
            _optimizedOrders.remove(order);
          });

          // If no more orders, go back
          if (widget.orders.isEmpty) {
            Navigator.pop(context);
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('❌ Erreur: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tournée (${widget.orders.length})'),
        backgroundColor: Colors.indigo[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _isGettingLocation ? null : _getCurrentLocation,
            icon: _isGettingLocation
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.my_location),
            tooltip: 'Ma position GPS',
          ),
        ],
      ),
      body: Column(
        children: [
          // Control Panel
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _startPoint == null
                            ? '📍 Cliquez sur la carte ou utilisez GPS'
                            : '✅ Point de départ défini',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _startPoint == null ? Colors.orange : Colors.green,
                        ),
                      ),
                    ),
                    if (_routeInfo.isNotEmpty) ...[
                      ElevatedButton.icon(
                        onPressed: _openFullRouteNavigation,
                        icon: const Icon(Icons.navigation, size: 20),
                        label: const Text('Naviguer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo[600],
                          foregroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    ElevatedButton.icon(
                      onPressed: _isLoadingRoute ? null : _calculateRoute,
                      icon: _isLoadingRoute
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.route),
                      label: Text(_isLoadingRoute ? 'Calcul...' : 'Calculer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
                if (_routeInfo.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    _routeInfo,
                    style: const TextStyle(
                      color: Colors.blue,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Map
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: widget.orders.isNotEmpty &&
                        widget.orders.first.buyerLocation != null
                    ? LatLng(
                        widget.orders.first.buyerLocation!.latitude,
                        widget.orders.first.buyerLocation!.longitude,
                      )
                    : const LatLng(33.5731, -7.5898),
                initialZoom: 12.0,
                onTap: (tapPosition, point) {
                  if (_startPoint == null) {
                    _setManualStartPoint(point);
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.book_delivery',
                ),
                if (_routeLines.isNotEmpty) PolylineLayer(polylines: _routeLines),
                MarkerLayer(markers: _buildMarkers()),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
