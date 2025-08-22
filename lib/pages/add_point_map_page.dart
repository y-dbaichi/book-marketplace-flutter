import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/storage_service.dart';
import '../services/geocoding_service.dart';
import '../models/point_de_vente.dart';

class AddPointMapPage extends StatefulWidget {
  const AddPointMapPage({super.key});

  @override
  State<AddPointMapPage> createState() => _AddPointMapPageState();
}

class _AddPointMapPageState extends State<AddPointMapPage> {
  final _formKey = GlobalKey<FormState>();
  final StorageService _storageService = StorageService();
  final GeocodingService _geocodingService = GeocodingService();
  final MapController _mapController = MapController();
  
  final _nomController = TextEditingController();
  final _adresseController = TextEditingController();
  final _contactController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _capaciteController = TextEditingController();
  
  bool _isLoading = false;
  bool _isSearching = false;
  LatLng? _selectedLocation;
  List<GeocodingResult> _searchResults = [];
  String _currentAddress = '';

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _nomController.dispose();
    _adresseController.dispose();
    _contactController.dispose();
    _telephoneController.dispose();
    _capaciteController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission != LocationPermission.denied && permission != LocationPermission.deniedForever) {
        Position position = await Geolocator.getCurrentPosition();
        setState(() {
          _selectedLocation = LatLng(position.latitude, position.longitude);
        });
        _mapController.move(_selectedLocation!, 15.0);
        _updateAddressFromLocation(_selectedLocation!);
      } else {
        // Default to Casablanca if no permission
        setState(() {
          _selectedLocation = const LatLng(33.5731, -7.5898);
        });
        _mapController.move(_selectedLocation!, 12.0);
      }
    } catch (e) {
      // Default location
      setState(() {
        _selectedLocation = const LatLng(33.5731, -7.5898);
      });
      _mapController.move(_selectedLocation!, 12.0);
    }
  }

  Future<void> _searchAddress(String query) async {
    if (query.length < 3) {
      setState(() => _searchResults = []);
      return;
    }

    setState(() => _isSearching = true);
    
    try {
      final results = await _geocodingService.searchAddress(query);
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() => _isSearching = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur de recherche: $e')),
        );
      }
    }
  }

  void _selectSearchResult(GeocodingResult result) {
    setState(() {
      _selectedLocation = result.coordinates;
      _currentAddress = result.displayName;
      _adresseController.text = result.displayName;
      _searchResults = [];
    });
    _mapController.move(_selectedLocation!, 16.0);
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    setState(() {
      _selectedLocation = point;
    });
    _updateAddressFromLocation(point);
  }

  Future<void> _updateAddressFromLocation(LatLng location) async {
    try {
      final address = await _geocodingService.getAddressFromCoordinates(
        location.latitude, 
        location.longitude
      );
      if (address != null && mounted) {
        setState(() {
          _currentAddress = address;
          _adresseController.text = address;
        });
      }
    } catch (e) {
      print('Error getting address: $e');
    }
  }

  Future<void> _savePoint() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner un emplacement sur la carte')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final point = PointDeVente(
        nom: _nomController.text.trim(),
        adresse: _adresseController.text.trim(),
        contact: _contactController.text.trim(),
        telephone: _telephoneController.text.trim(),
        capaciteStockage: int.parse(_capaciteController.text),
        latitude: _selectedLocation!.latitude,
        longitude: _selectedLocation!.longitude,
      );

      await _storageService.insertPointDeVente(point);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Point de vente ajouté avec succès')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur lors de la sauvegarde: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.indigo[600],
        foregroundColor: Colors.white,
        title: const Text(
          '📍 Ajouter Point',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _savePoint,
              icon: _isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.save, size: 18),
              label: Text(_isLoading ? 'Sauvegarde...' : 'SAUVER'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _adresseController,
                  decoration: InputDecoration(
                    hintText: 'Rechercher une adresse...',
                    hintStyle: TextStyle(color: Colors.grey[500]),
                    prefixIcon: Icon(Icons.search, color: Colors.indigo[400]),
                    suffixIcon: _isSearching
                        ? Container(
                            padding: const EdgeInsets.all(12),
                            child: const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.indigo),
                            ),
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.indigo[400]!, width: 2),
                    ),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  onChanged: _searchAddress,
                ),
                if (_searchResults.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    constraints: const BoxConstraints(maxHeight: 200),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final result = _searchResults[index];
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on, size: 16),
                          title: Text(
                            result.displayName,
                            style: const TextStyle(fontSize: 14),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          onTap: () => _selectSearchResult(result),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Map
          Expanded(
            flex: 2,
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _selectedLocation ?? const LatLng(33.5731, -7.5898),
                initialZoom: 12.0,
                onTap: _onMapTap,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.my_awesome_app',
                ),
                if (_selectedLocation != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _selectedLocation!,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.location_pin,
                          color: Colors.red,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          
          // Form
          Expanded(
            flex: 1,
            child: Container(
              color: Colors.grey[50],
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildFormField(
                            controller: _nomController,
                            label: 'Nom du point *',
                            icon: Icons.store,
                            validator: (value) => value?.trim().isEmpty == true ? 'Obligatoire' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildFormField(
                            controller: _contactController,
                            label: 'Contact *',
                            icon: Icons.person,
                            validator: (value) => value?.trim().isEmpty == true ? 'Obligatoire' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildFormField(
                            controller: _telephoneController,
                            label: 'Téléphone *',
                            icon: Icons.phone,
                            keyboardType: TextInputType.phone,
                            validator: (value) => value?.trim().isEmpty == true ? 'Obligatoire' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildFormField(
                            controller: _capaciteController,
                            label: 'Capacité *',
                            icon: Icons.inventory,
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value?.trim().isEmpty == true) return 'Obligatoire';
                              if (int.tryParse(value!) == null) return 'Nombre invalide';
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (_selectedLocation != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.indigo[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.indigo[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.gps_fixed, color: Colors.indigo[600], size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Coordonnées: ${_selectedLocation!.latitude.toStringAsFixed(6)}, ${_selectedLocation!.longitude.toStringAsFixed(6)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.indigo[700],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
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

  Widget _buildFormField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.indigo[400]),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.indigo[400]!, width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
        isDense: true,
      ),
      validator: validator,
    );
  }
}
