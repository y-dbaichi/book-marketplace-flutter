class PointDeVente {
  final int? id;
  final String nom;
  final String adresse;
  final String contact;
  final String telephone;
  final int capaciteStockage;
  final double latitude;
  final double longitude;
  final DateTime dateCreation;

  PointDeVente({
    this.id,
    required this.nom,
    required this.adresse,
    required this.contact,
    required this.telephone,
    required this.capaciteStockage,
    required this.latitude,
    required this.longitude,
    DateTime? dateCreation,
  }) : dateCreation = dateCreation ?? DateTime.now();

  // Convert to Map for SQLite
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nom': nom,
      'adresse': adresse,
      'contact': contact,
      'telephone': telephone,
      'capacite_stockage': capaciteStockage,
      'latitude': latitude,
      'longitude': longitude,
      'date_creation': dateCreation.toIso8601String(),
    };
  }

  // Create from Map (SQLite result)
  factory PointDeVente.fromMap(Map<String, dynamic> map) {
    return PointDeVente(
      id: map['id'],
      nom: map['nom'],
      adresse: map['adresse'],
      contact: map['contact'],
      telephone: map['telephone'],
      capaciteStockage: map['capacite_stockage'],
      latitude: map['latitude'],
      longitude: map['longitude'],
      dateCreation: DateTime.parse(map['date_creation']),
    );
  }

  @override
  String toString() {
    return 'PointDeVente{id: $id, nom: $nom, adresse: $adresse, lat: $latitude, lng: $longitude}';
  }
}
