import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/point_de_vente.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;

  DatabaseHelper._internal();

  factory DatabaseHelper() => _instance;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    try {
      String path = join(await getDatabasesPath(), 'livreur.db');
      print('Database path: $path'); // Debug

      return await openDatabase(
        path,
        version: 1,
        onCreate: _onCreate,
      );
    } catch (e) {
      print('Database initialization error: $e'); // Debug
      rethrow;
    }
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE points_de_vente(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        adresse TEXT NOT NULL,
        contact TEXT NOT NULL,
        telephone TEXT NOT NULL,
        capacite_stockage INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        date_creation TEXT NOT NULL
      )
    ''');
  }

  // CRUD Operations
  Future<int> insertPointDeVente(PointDeVente point) async {
    try {
      print('Inserting point: ${point.toMap()}'); // Debug
      final db = await database;
      final id = await db.insert('points_de_vente', point.toMap());
      print('Point inserted with ID: $id'); // Debug
      return id;
    } catch (e) {
      print('Insert error: $e'); // Debug
      rethrow;
    }
  }

  Future<List<PointDeVente>> getAllPointsDeVente() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('points_de_vente');
    
    return List.generate(maps.length, (i) {
      return PointDeVente.fromMap(maps[i]);
    });
  }

  Future<PointDeVente?> getPointDeVente(int id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'points_de_vente',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return PointDeVente.fromMap(maps.first);
    }
    return null;
  }

  Future<int> updatePointDeVente(PointDeVente point) async {
    final db = await database;
    return await db.update(
      'points_de_vente',
      point.toMap(),
      where: 'id = ?',
      whereArgs: [point.id],
    );
  }

  Future<int> deletePointDeVente(int id) async {
    final db = await database;
    return await db.delete(
      'points_de_vente',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> close() async {
    final db = await database;
    db.close();
  }
}
