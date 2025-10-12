import 'dart:convert';
import '../models/geojson_export.dart';
import '../utils/constants.dart';
import 'api_service.dart';
import 'storage_service.dart';
import '../models/point_de_vente.dart';

class GeoJSONService {
  static final GeoJSONService _instance = GeoJSONService._internal();
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  GeoJSONService._internal();
  factory GeoJSONService() => _instance;

  Future<List<GeoJSONExport>> getMyExports() async {
    print('📥 Fetching GeoJSON exports...');
    final response = await _api.get(AppConstants.geojsonExportsEndpoint);
    
    final List<dynamic> exportsData = response.data['exports'];
    final exports = exportsData.map((e) => GeoJSONExport.fromJson(e)).toList();
    
    print('✅ Found ${exports.length} exports');
    return exports;
  }

  Future<List<PointDeVente>> downloadAndImport(String exportId) async {
    print('📥 Downloading GeoJSON export: $exportId');
    
    final response = await _api.get('${AppConstants.geojsonDownloadEndpoint}/$exportId');
    final geoJsonData = GeoJSONData.fromJson(response.data);
    
    print('✅ Downloaded ${geoJsonData.featureCount} features');
    
    // Convert GeoJSON features to PointDeVente and insert them
    final points = <PointDeVente>[];
    for (var feature in geoJsonData.features) {
      final point = PointDeVente(
        nom: feature.properties.locationName ?? 'Point de vente',
        contact: feature.properties.contactName ?? '',
        telephone: feature.properties.contactPhone ?? '',
        adresse: feature.properties.address ?? '',
        latitude: feature.geometry.latitude,
        longitude: feature.geometry.longitude,
        capaciteStockage: 100,
      );
      
      // Insert point into database
      await _storage.insertPointDeVente(point);
      points.add(point);
    }
    
    print('✅ Imported ${points.length} points to local storage');
    return points;
  }
}
