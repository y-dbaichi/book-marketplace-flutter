import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/point_de_vente.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  static SharedPreferences? _prefs;
  static const String _storageKey = 'points_de_vente_data';

  StorageService._internal();

  factory StorageService() => _instance;

  Future<void> _initStorage() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<int> insertPointDeVente(PointDeVente point) async {
    await _initStorage();

    try {
      // print('📝 Inserting point: ${point.nom}'); // Debug

      final points = await getAllPointsDeVente();
      final newId = points.isEmpty ? 1 : points.map((p) => p.id!).reduce((a, b) => a > b ? a : b) + 1;

      final newPoint = PointDeVente(
        id: newId,
        nom: point.nom,
        adresse: point.adresse,
        contact: point.contact,
        telephone: point.telephone,
        capaciteStockage: point.capaciteStockage,
        latitude: point.latitude,
        longitude: point.longitude,
        dateCreation: point.dateCreation,
      );

      points.add(newPoint);
      await _savePoints(points);

      // print('✅ Point saved with ID: $newId'); // Debug
      return newId;
    } catch (e) {
      print('❌ Error inserting point: $e'); // Debug
      rethrow;
    }
  }

  Future<List<PointDeVente>> getAllPointsDeVente() async {
    await _initStorage();

    try {
      final jsonString = _prefs!.getString(_storageKey) ?? '[]';
      // print('📖 Loading points from storage: $jsonString'); // Debug

      final List<dynamic> jsonList = jsonDecode(jsonString);
      final points = jsonList.map((json) => PointDeVente.fromMap(json)).toList();

      // print('✅ Loaded ${points.length} points'); // Debug
      return points;
    } catch (e) {
      print('❌ Error loading points: $e'); // Debug
      return [];
    }
  }

  Future<PointDeVente?> getPointDeVente(int id) async {
    final points = await getAllPointsDeVente();
    try {
      return points.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }

  Future<int> updatePointDeVente(PointDeVente point) async {
    final points = await getAllPointsDeVente();
    final index = points.indexWhere((p) => p.id == point.id);
    if (index != -1) {
      points[index] = point;
      await _savePoints(points);
      return 1;
    }
    return 0;
  }

  Future<int> deletePointDeVente(int id) async {
    final points = await getAllPointsDeVente();
    final initialLength = points.length;
    points.removeWhere((p) => p.id == id);
    if (points.length < initialLength) {
      await _savePoints(points);
      return 1;
    }
    return 0;
  }

  Future<void> _savePoints(List<PointDeVente> points) async {
    await _initStorage();
    try {
      final jsonString = jsonEncode(points.map((p) => p.toMap()).toList());
      await _prefs!.setString(_storageKey, jsonString);
      // print('💾 Saved ${points.length} points to storage'); // Debug
    } catch (e) {
      print('❌ Error saving points: $e'); // Debug
      rethrow;
    }
  }

  Future<void> close() async {
    // Nothing to close for SharedPreferences
  }

  // Helper method to clear all data (for testing)
  Future<void> clearAllData() async {
    await _initStorage();
    await _prefs!.remove(_storageKey);
    print('🗑️ All data cleared'); // Debug
  }
}
