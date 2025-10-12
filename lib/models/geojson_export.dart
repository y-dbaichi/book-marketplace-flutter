class GeoJSONExport {
  final String id;
  final String fileName;
  final int fileSize;
  final String status;
  final String exportType;
  final DateTime createdAt;
  final DateTime expiresAt;
  final int downloadCount;
  final DateTime? lastDownloaded;
  final int? featureCount;

  GeoJSONExport({
    required this.id,
    required this.fileName,
    required this.fileSize,
    required this.status,
    required this.exportType,
    required this.createdAt,
    required this.expiresAt,
    required this.downloadCount,
    this.lastDownloaded,
    this.featureCount,
  });

  factory GeoJSONExport.fromJson(Map<String, dynamic> json) {
    return GeoJSONExport(
      id: json['id'] ?? '',
      fileName: json['fileName'] ?? '',
      fileSize: json['fileSize'] ?? 0,
      status: json['status'] ?? 'generating',
      exportType: json['exportType'] ?? 'buyer_orders',
      createdAt: DateTime.parse(json['createdAt']),
      expiresAt: DateTime.parse(json['expiresAt']),
      downloadCount: json['downloadCount'] ?? 0,
      lastDownloaded: json['lastDownloaded'] != null ? DateTime.parse(json['lastDownloaded']) : null,
      featureCount: json['featureCount'],
    );
  }

  bool get isReady => status == 'ready';
  bool get isExpired => status == 'expired' || expiresAt.isBefore(DateTime.now());

  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class GeoJSONFeature {
  final String type;
  final Geometry geometry;
  final Properties properties;

  GeoJSONFeature({
    required this.type,
    required this.geometry,
    required this.properties,
  });

  factory GeoJSONFeature.fromJson(Map<String, dynamic> json) {
    return GeoJSONFeature(
      type: json['type'] ?? 'Feature',
      geometry: Geometry.fromJson(json['geometry']),
      properties: Properties.fromJson(json['properties']),
    );
  }
}

class Geometry {
  final String type;
  final List<double> coordinates;

  Geometry({
    required this.type,
    required this.coordinates,
  });

  factory Geometry.fromJson(Map<String, dynamic> json) {
    return Geometry(
      type: json['type'] ?? 'Point',
      coordinates: List<double>.from(json['coordinates'].map((x) => x.toDouble())),
    );
  }

  double get latitude => coordinates[1];
  double get longitude => coordinates[0];
}

class Properties {
  final String? orderId;
  final String? bookTitle;
  final String? bookAuthor;
  final int? quantity;
  final double? totalPrice;
  final String? orderType;
  final String? status;
  final String? locationName;
  final String? address;
  final String? contactName;
  final String? contactPhone;
  final String? pointType;
  final DateTime? orderDate;
  final String? notes;

  Properties({
    this.orderId,
    this.bookTitle,
    this.bookAuthor,
    this.quantity,
    this.totalPrice,
    this.orderType,
    this.status,
    this.locationName,
    this.address,
    this.contactName,
    this.contactPhone,
    this.pointType,
    this.orderDate,
    this.notes,
  });

  factory Properties.fromJson(Map<String, dynamic> json) {
    return Properties(
      orderId: json['orderId'],
      bookTitle: json['bookTitle'],
      bookAuthor: json['bookAuthor'],
      quantity: json['quantity'],
      totalPrice: json['totalPrice']?.toDouble(),
      orderType: json['orderType'],
      status: json['status'],
      locationName: json['locationName'],
      address: json['address'],
      contactName: json['contactName'],
      contactPhone: json['contactPhone'],
      pointType: json['pointType'],
      orderDate: json['orderDate'] != null ? DateTime.parse(json['orderDate']) : null,
      notes: json['notes'],
    );
  }
}

class GeoJSONData {
  final String type;
  final List<GeoJSONFeature> features;

  GeoJSONData({
    required this.type,
    required this.features,
  });

  factory GeoJSONData.fromJson(Map<String, dynamic> json) {
    return GeoJSONData(
      type: json['type'] ?? 'FeatureCollection',
      features: (json['features'] as List).map((feature) => GeoJSONFeature.fromJson(feature)).toList(),
    );
  }

  int get featureCount => features.length;
}
