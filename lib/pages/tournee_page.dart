import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/point_de_vente.dart';
import '../services/route_service.dart';

class TourneePage extends StatefulWidget {
  final List<PointDeVente> points;

  const TourneePage({super.key, required this.points});

  @override
  State<TourneePage> createState() => _TourneePageState();
}

class _TourneePageState extends State<TourneePage> {
  final MapController _mapController = MapController();
  final RouteService _routeService = RouteService();
  
  LatLng? _startPoint;
  List<LatLng> _optimizedRoute = [];
  List<Polyline> _routeLines = [];
  bool _isLoadingRoute = false;
  bool _isGettingLocation = false;
  String _routeInfo = '';

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  void _initializeMap() {
    if (widget.points.isNotEmpty) {
      // Center map on first point
      final firstPoint = widget.points.first;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(
          LatLng(firstPoint.latitude, firstPoint.longitude),
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
          const SnackBar(content: Text('Position GPS définie comme point de départ')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur GPS: $e')),
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
      const SnackBar(content: Text('Point de départ défini manuellement')),
    );
  }

  Future<void> _calculateRoute() async {
    if (_startPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez définir un point de départ')),
      );
      return;
    }

    setState(() => _isLoadingRoute = true);

    try {
      // Convert points to LatLng
      List<LatLng> pointsLatLng = widget.points
          .map((p) => LatLng(p.latitude, p.longitude))
          .toList();

      // Optimize route using nearest neighbor
      _optimizedRoute = _routeService.optimizeRoute(_startPoint!, pointsLatLng);

      // Get route from OpenRouteService (or mock)
      final routeData = await _routeService.getRoute(_optimizedRoute);

      if (routeData != null) {
        _processRouteData(routeData);
      } else {
        throw Exception('Impossible de calculer l\'itinéraire');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur de calcul: $e')),
        );
      }
    } finally {
      setState(() => _isLoadingRoute = false);
    }
  }

  void _processRouteData(Map<String, dynamic> routeData) {
    try {
      print('🔍 Processing route data: ${routeData.keys}');

      // Handle both GeoJSON format (POST) and simple format (GET)
      List<LatLng> routePoints = [];
      double? distance;
      double? duration;

      if (routeData.containsKey('features')) {
        // GeoJSON format from POST request
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

          // Extract route info
          final summary = properties['summary'];
          if (summary != null) {
            distance = summary['distance']?.toDouble();
            duration = summary['duration']?.toDouble();
          }
        }
      } else if (routeData.containsKey('routes')) {
        // Standard ORS format from GET request
        final routes = routeData['routes'] as List;
        if (routes.isNotEmpty) {
          final route = routes[0];
          final geometry = route['geometry'];

          if (geometry is String) {
            // Decode polyline if it's encoded
            routePoints = _decodePolyline(geometry);
          } else if (geometry is List) {
            // Direct coordinates
            routePoints = geometry
                .map((coord) => LatLng(coord[1], coord[0]))
                .toList();
          }

          // Extract route info
          final summary = route['summary'];
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
            ),
          ];
        });

        // Update route info
        if (distance != null && duration != null) {
          final distanceKm = (distance / 1000).toStringAsFixed(1);
          final durationMin = (duration / 60).toStringAsFixed(0);
          setState(() {
            _routeInfo = 'Distance: ${distanceKm}km - Durée: ${durationMin}min';
          });
        }

        // Fit map to show entire route
        _fitMapToRoute(routePoints);

        print('✅ Route processed: ${routePoints.length} points');
      } else {
        print('❌ No route points found in response');
      }
    } catch (e) {
      print('❌ Error processing route data: $e');
      print('Raw data: $routeData');
    }
  }

  // Simple polyline decoder (basic implementation)
  List<LatLng> _decodePolyline(String encoded) {
    // This is a simplified decoder - for production use a proper polyline package
    List<LatLng> points = [];
    // For now, return empty list - the real implementation would decode the polyline
    print('⚠️ Polyline decoding not implemented - using direct coordinates');
    return points;
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

    _mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)));
  }

  List<Marker> _buildMarkers() {
    List<Marker> markers = [];

    // Start point marker
    if (_startPoint != null) {
      markers.add(
        Marker(
          point: _startPoint!,
          width: 40,
          height: 40,
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.play_arrow,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      );
    }

    // Points de vente markers in optimized route order
    if (_optimizedRoute.isNotEmpty) {
      // Skip the first point (start point) and show route order numbers
      for (int i = 1; i < _optimizedRoute.length; i++) {
        final routePoint = _optimizedRoute[i];

        // Find the corresponding PointDeVente for this coordinate
        final pointDeVente = widget.points.firstWhere(
          (p) => (p.latitude - routePoint.latitude).abs() < 0.0001 &&
                 (p.longitude - routePoint.longitude).abs() < 0.0001,
          orElse: () => widget.points.first,
        );

        markers.add(
          Marker(
            point: routePoint,
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showPointDetails(pointDeVente),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$i', // Route order number (1, 2, 3...)
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      }
    } else {
      // Fallback: show original order if route not optimized yet
      for (int i = 0; i < widget.points.length; i++) {
        final point = widget.points[i];
        markers.add(
          Marker(
            point: LatLng(point.latitude, point.longitude),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showPointDetails(point),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${i + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      }
    }

    return markers;
  }

  void _showPointDetails(PointDeVente point) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              point.nom,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('Adresse: ${point.adresse}'),
            Text('Contact: ${point.contact}'),
            Text('Téléphone: ${point.telephone}'),
            Text('Capacité: ${point.capaciteStockage}'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _callContact(point.telephone),
                    icon: const Icon(Icons.phone),
                    label: const Text('Appeler'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    label: const Text('Fermer'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _callContact(String phoneNumber) async {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tournée'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            onPressed: _isGettingLocation ? null : _getCurrentLocation,
            icon: _isGettingLocation 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
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
                            ? 'Point de départ: Non défini'
                            : 'Point de départ: ${_startPoint!.latitude.toStringAsFixed(4)}, ${_startPoint!.longitude.toStringAsFixed(4)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
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
                    style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w500),
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
                initialCenter: widget.points.isNotEmpty 
                    ? LatLng(widget.points.first.latitude, widget.points.first.longitude)
                    : const LatLng(33.5731, -7.5898), // Casablanca default
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
                  userAgentPackageName: 'com.example.my_awesome_app',
                ),
                if (_routeLines.isNotEmpty)
                  PolylineLayer(polylines: _routeLines),
                MarkerLayer(markers: _buildMarkers()),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
