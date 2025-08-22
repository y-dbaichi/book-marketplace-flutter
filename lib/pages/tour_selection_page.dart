import 'package:flutter/material.dart';
import '../models/point_de_vente.dart';
import '../services/sample_points_service.dart';
import 'tournee_page.dart';

class TourSelectionPage extends StatefulWidget {
  final List<PointDeVente> existingPoints;

  const TourSelectionPage({super.key, required this.existingPoints});

  @override
  State<TourSelectionPage> createState() => _TourSelectionPageState();
}

class _TourSelectionPageState extends State<TourSelectionPage> {
  List<PointDeVente> _allPoints = [];
  Set<int> _selectedPointIds = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _allPoints = List.from(widget.existingPoints);
    // Pre-select all existing points
    _selectedPointIds = widget.existingPoints
        .where((p) => p.id != null)
        .map((p) => p.id!)
        .toSet();
  }

  Future<void> _showUploadDialog() async {
    final sampleSets = SamplePointsService.getAllSampleSets();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.cloud_upload, color: Colors.indigo),
            SizedBox(width: 8),
            Text('Ajouter Points Sample'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: sampleSets.entries.map((entry) {
            return Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.indigo[100],
                  child: Text(
                    '${entry.value.length}',
                    style: TextStyle(color: Colors.indigo[800], fontWeight: FontWeight.bold),
                  ),
                ),
                title: Text(entry.key),
                subtitle: Text('${entry.value.length} points de vente'),
                trailing: const Icon(Icons.add, color: Colors.green),
                onTap: () {
                  Navigator.pop(context);
                  _addSamplePoints(entry.key, entry.value);
                },
              ),
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
        ],
      ),
    );
  }

  void _addSamplePoints(String setName, List<PointDeVente> points) {
    setState(() {
      // Add unique IDs to sample points
      int maxId = _allPoints.isEmpty ? 0 : _allPoints.map((p) => p.id ?? 0).reduce((a, b) => a > b ? a : b);
      
      for (int i = 0; i < points.length; i++) {
        final newPoint = PointDeVente(
          id: maxId + i + 1,
          nom: points[i].nom,
          adresse: points[i].adresse,
          contact: points[i].contact,
          telephone: points[i].telephone,
          capaciteStockage: points[i].capaciteStockage,
          latitude: points[i].latitude,
          longitude: points[i].longitude,
          dateCreation: points[i].dateCreation,
        );
        _allPoints.add(newPoint);
        // Auto-select new points
        _selectedPointIds.add(newPoint.id!);
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ ${points.length} points de $setName ajoutés'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _startTour() {
    final selectedPoints = _allPoints
        .where((p) => _selectedPointIds.contains(p.id))
        .toList();

    if (selectedPoints.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Veuillez sélectionner au moins un point'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => TourneePage(points: selectedPoints),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.indigo[600],
        foregroundColor: Colors.white,
        title: Text(
          '🎯 Sélection Tournée (${_selectedPointIds.length})',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // Stats and Upload Section
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo[600]!, Colors.indigo[400]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.indigo.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.route, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_allPoints.length} Points Disponibles',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${_selectedPointIds.length} sélectionnés pour la tournée',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _showUploadDialog,
                        icon: const Icon(Icons.cloud_upload),
                        label: const Text('Upload Points'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.indigo[600],
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _selectedPointIds.isEmpty ? null : _startTour,
                        icon: const Icon(Icons.play_arrow),
                        label: Text('Démarrer (${_selectedPointIds.length})'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Points List
          Expanded(
            child: _allPoints.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.route, size: 48, color: Colors.grey[400]),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Aucun point disponible',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Utilisez "Upload Points" pour ajouter des points',
                          style: TextStyle(color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _allPoints.length,
                    itemBuilder: (context, index) {
                      final point = _allPoints[index];
                      final isSelected = _selectedPointIds.contains(point.id);
                      final isExisting = widget.existingPoints.any((p) => p.id == point.id);
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: isSelected ? Colors.indigo : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          color: isSelected ? Colors.indigo.withOpacity(0.05) : Colors.white,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              setState(() {
                                if (isSelected) {
                                  _selectedPointIds.remove(point.id!);
                                } else {
                                  _selectedPointIds.add(point.id!);
                                }
                              });
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  // Checkbox
                                  Container(
                                    width: 50,
                                    height: 50,
                                    decoration: BoxDecoration(
                                      color: isSelected ? Colors.indigo : Colors.grey[200],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      isSelected ? Icons.check : Icons.location_on,
                                      color: isSelected ? Colors.white : Colors.grey[600],
                                    ),
                                  ),
                                  
                                  const SizedBox(width: 16),
                                  
                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                point.nom,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                            ),
                                            if (isExisting)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.blue[100],
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  'Manuel',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.blue[800],
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              )
                                            else
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.green[100],
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  'Sample',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.green[800],
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          point.adresse,
                                          style: TextStyle(
                                            color: Colors.grey[600],
                                            fontSize: 14,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            _buildInfoChip(Icons.person, point.contact),
                                            const SizedBox(width: 8),
                                            _buildInfoChip(Icons.inventory, '${point.capaciteStockage}'),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
