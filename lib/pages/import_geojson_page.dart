import 'package:flutter/material.dart';
import '../services/geojson_service.dart';
import '../models/geojson_export.dart';

class ImportGeoJSONPage extends StatefulWidget {
  const ImportGeoJSONPage({Key? key}) : super(key: key);

  @override
  State<ImportGeoJSONPage> createState() => _ImportGeoJSONPageState();
}

class _ImportGeoJSONPageState extends State<ImportGeoJSONPage> {
  final _geoJsonService = GeoJSONService();
  List<GeoJSONExport>? _exports;
  bool _isLoading = true;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _loadExports();
  }

  Future<void> _loadExports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final exports = await _geoJsonService.getMyExports();
      setState(() {
        _exports = exports;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load exports: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _importExport(GeoJSONExport export) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final points = await _geoJsonService.downloadAndImport(export.id);
      setState(() {
        _successMessage = '✅ Imported ${points.length} points successfully!';
        _isLoading = false;
      });

      // Wait a bit then go back
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.of(context).pop(true); // Return true to indicate success
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Import failed: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Import from Backend'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _loadExports,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadExports,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_successMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, size: 64, color: Colors.green.shade400),
              const SizedBox(height: 16),
              Text(
                _successMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      );
    }

    if (_exports == null || _exports!.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inbox, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              const Text(
                'No exports available',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Generate exports from the web dashboard first',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _exports!.length,
      itemBuilder: (context, index) {
        final export = _exports![index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: export.isReady ? Colors.green : Colors.orange,
              child: Text(
                '${export.featureCount ?? 0}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(
              export.fileName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('Status: ${export.status}'),
                Text('Created: ${_formatDate(export.createdAt)}'),
                Text('Size: ${export.fileSizeFormatted}'),
              ],
            ),
            trailing: export.isReady
                ? IconButton(
                    icon: const Icon(Icons.download),
                    color: Colors.blue,
                    onPressed: () => _importExport(export),
                  )
                : const Icon(Icons.hourglass_empty, color: Colors.grey),
            isThreeLine: true,
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
