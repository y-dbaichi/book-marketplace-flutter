import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../services/auth_service.dart';
import '../services/geojson_service.dart';
import '../models/point_de_vente.dart';
import 'add_point_map_page.dart';
import 'tour_selection_page.dart';
import 'login_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final StorageService _storageService = StorageService();
  final AuthService _authService = AuthService();
  final GeoJSONService _geoJsonService = GeoJSONService();
  
  List<PointDeVente> _points = [];
  bool _isLoading = true;
  bool _isSyncing = false;
  DateTime? _lastSync;

  @override
  void initState() {
    super.initState();
    _loadPoints();
    _autoSync();
  }

  Future<void> _loadPoints() async {
    setState(() => _isLoading = true);
    try {
      final points = await _storageService.getAllPointsDeVente();
      setState(() {
        _points = points;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur lors du chargement: $e')),
        );
      }
    }
  }

  Future<void> _autoSync() async {
    if (_isSyncing) return;
    
    setState(() => _isSyncing = true);
    
    try {
      print('🔄 Auto-syncing orders from backend...');
      
      // Generate fresh export of confirmed orders
      final exports = await _geoJsonService.getMyExports();
      
      if (exports.isEmpty) {
        print('⚠️ No exports found, generating new one...');
        // No exports exist, need to generate via backend
        // For now, just skip auto-sync
        setState(() => _isSyncing = false);
        return;
      }
      
      // Get the latest export
      final latestExport = exports.first;
      
      // Check if we already synced this export
      if (_lastSync != null && 
          latestExport.createdAt.isBefore(_lastSync!)) {
        print('✅ Already synced latest export');
        setState(() => _isSyncing = false);
        return;
      }
      
      // Download and import
      print('📥 Downloading ${latestExport.featureCount ?? 0} points...');
      await _geoJsonService.downloadAndImport(latestExport.id);
      
      setState(() {
        _lastSync = DateTime.now();
        _isSyncing = false;
      });
      
      await _loadPoints();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Synchronisé: ${latestExport.featureCount ?? 0} points'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      print('❌ Auto-sync failed: $e');
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _manualSync() async {
    await _autoSync();
  }

  Future<void> _deletePoint(PointDeVente point) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text('Voulez-vous supprimer "${point.nom}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && point.id != null) {
      await _storageService.deletePointDeVente(point.id!);
      _loadPoints();
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Se déconnecter'),
        content: const Text('Voulez-vous vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Déconnexion', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _authService.logout();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginPage()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _authService.currentUser;
    
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Livraisons'),
            if (user != null)
              Text(
                user.displayName,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              ),
          ],
        ),
        actions: [
          if (_isSyncing)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.sync),
              tooltip: 'Synchroniser',
              onPressed: _manualSync,
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: _logout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _manualSync,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _points.isEmpty
                ? ListView(
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height - 200,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.location_off, size: 64, color: Colors.grey[400]),
                              const SizedBox(height: 16),
                              const Text(
                                'Aucune livraison',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _lastSync == null 
                                    ? 'Tirez pour synchroniser les commandes' 
                                    : 'Aucune commande confirmée',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton.icon(
                                onPressed: _isSyncing ? null : _manualSync,
                                icon: const Icon(Icons.sync),
                                label: const Text('Synchroniser'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  )
                : Column(
                    children: [
                      // Sync status banner
                      if (_lastSync != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          color: Colors.green.shade50,
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, size: 16, color: Colors.green.shade700),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Synchronisé: ${_points.length} livraisons • ${_formatLastSync()}',
                                  style: TextStyle(fontSize: 12, color: Colors.green.shade700),
                                ),
                              ),
                            ],
                          ),
                        ),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _points.length,
                          itemBuilder: (context, index) {
                            final point = _points[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: Colors.blue,
                                  child: Text(
                                    point.nom[0].toUpperCase(),
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                title: Text(point.nom),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (point.telephone.isNotEmpty) Text('📞 ${point.telephone}'),
                                    if (point.adresse.isNotEmpty) Text('📍 ${point.adresse}'),
                                    if (point.contact.isNotEmpty) Text('👤 ${point.contact}'),
                                  ],
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deletePoint(point),
                                ),
                                isThreeLine: true,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'add',
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddPointMapPage()),
              );
              _loadPoints();
            },
            child: const Icon(Icons.add),
          ),
          const SizedBox(height: 16),
          FloatingActionButton.extended(
            heroTag: 'route',
            onPressed: _points.length < 2
                ? null
                : () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TourSelectionPage(existingPoints: _points),
                      ),
                    );
                  },
            icon: const Icon(Icons.route),
            label: const Text('Tournée'),
          ),
        ],
      ),
    );
  }

  String _formatLastSync() {
    if (_lastSync == null) return '';
    final diff = DateTime.now().difference(_lastSync!);
    if (diff.inMinutes < 1) return 'à l\'instant';
    if (diff.inMinutes < 60) return 'il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'il y a ${diff.inHours}h';
    return 'il y a ${diff.inDays}j';
  }
}
