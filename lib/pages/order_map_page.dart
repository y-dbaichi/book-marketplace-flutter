import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/order.dart';

class OrderMapPage extends StatefulWidget {
  final List<Order> orders;

  const OrderMapPage({super.key, required this.orders});

  @override
  State<OrderMapPage> createState() => _OrderMapPageState();
}

class _OrderMapPageState extends State<OrderMapPage> {
  final MapController _mapController = MapController();
  Order? _selectedOrder;

  @override
  void initState() {
    super.initState();
    // Center map on first order
    if (widget.orders.isNotEmpty && widget.orders.first.buyerLocation != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final loc = widget.orders.first.buyerLocation!;
        _mapController.move(LatLng(loc.latitude, loc.longitude), 12);
      });
    }
  }

  List<Marker> _buildMarkers() {
    return widget.orders
        .where((order) => order.buyerLocation != null)
        .map((order) {
      final loc = order.buyerLocation!;
      final isSelected = _selectedOrder?.id == order.id;

      return Marker(
        point: LatLng(loc.latitude, loc.longitude),
        width: 50,
        height: 50,
        child: GestureDetector(
          onTap: () {
            setState(() => _selectedOrder = order);
            _mapController.move(LatLng(loc.latitude, loc.longitude), 14);
          },
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.location_on,
                size: isSelected ? 50 : 40,
                color: isSelected ? Colors.red : Colors.blue,
              ),
              Positioned(
                top: isSelected ? 6 : 8,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    order.quantity.toString(),
                    style: TextStyle(
                      fontSize: isSelected ? 12 : 10,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Carte de livraison (${widget.orders.length} points)'),
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: widget.orders.isNotEmpty && widget.orders.first.buyerLocation != null
                  ? LatLng(
                      widget.orders.first.buyerLocation!.latitude,
                      widget.orders.first.buyerLocation!.longitude,
                    )
                  : const LatLng(33.5731, -7.5898),
              initialZoom: 12,
              minZoom: 5,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.book_delivery',
              ),
              MarkerLayer(markers: _buildMarkers()),
            ],
          ),
          // Bottom sheet with selected order info
          if (_selectedOrder != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Card(
                margin: EdgeInsets.zero,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedOrder!.book.title,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Par ${_selectedOrder!.book.author}',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => setState(() => _selectedOrder = null),
                          ),
                        ],
                      ),
                      const Divider(),
                      _buildInfoRow(Icons.person, 'Client', _selectedOrder!.buyerName),
                      _buildInfoRow(Icons.phone, 'Téléphone', _selectedOrder!.buyer.phone ?? 'N/A'),
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
                      if (_selectedOrder!.buyerNotes != null) ...[
                        const Divider(),
                        Text(
                          'Notes: ${_selectedOrder!.buyerNotes}',
                          style: TextStyle(color: Colors.grey[700], fontStyle: FontStyle.italic),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          // Legend at top
          Positioned(
            top: 16,
            right: 16,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Légende',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on, color: Colors.blue, size: 20),
                        const SizedBox(width: 4),
                        const Text('Point de livraison'),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on, color: Colors.red, size: 20),
                        const SizedBox(width: 4),
                        const Text('Sélectionné'),
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

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(color: Colors.grey[600])),
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
