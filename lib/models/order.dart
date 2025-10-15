class Order {
  final String id;
  final OrderBook book;
  final OrderUser buyer;
  final int quantity;
  final double totalPrice;
  final String status; // pending, confirmed, delivered, refused
  final OrderLocation? buyerLocation;
  final String? buyerNotes;
  final String? sellerNotes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Order({
    required this.id,
    required this.book,
    required this.buyer,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    this.buyerLocation,
    this.buyerNotes,
    this.sellerNotes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] as String,
      book: OrderBook.fromJson(json['book'] as Map<String, dynamic>),
      buyer: OrderUser.fromJson(json['buyer'] as Map<String, dynamic>),
      quantity: json['quantity'] as int,
      totalPrice: (json['totalPrice'] as num).toDouble(),
      status: json['status'] as String,
      buyerLocation: json['buyerLocation'] != null
          ? OrderLocation.fromJson(json['buyerLocation'] as Map<String, dynamic>)
          : null,
      buyerNotes: json['buyerNotes'] as String?,
      sellerNotes: json['sellerNotes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  // Helper getters
  bool get isConfirmed => status == 'confirmed';
  bool get isDelivered => status == 'delivered';
  bool get isPending => status == 'pending';
  bool get isRefused => status == 'refused';

  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'delivered':
        return 'Livrée';
      case 'refused':
        return 'Refusée';
      default:
        return status;
    }
  }

  String get buyerName {
    if (buyer.profile?.firstName != null && buyer.profile?.lastName != null) {
      return '${buyer.profile!.firstName} ${buyer.profile!.lastName}';
    }
    return buyer.email;
  }
}

class OrderBook {
  final String id;
  final String title;
  final String author;
  final double? price;

  OrderBook({
    required this.id,
    required this.title,
    required this.author,
    this.price,
  });

  factory OrderBook.fromJson(Map<String, dynamic> json) {
    return OrderBook(
      id: json['_id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
    );
  }
}

class OrderUser {
  final String id;
  final String email;
  final String? phone;
  final UserProfile? profile;

  OrderUser({
    required this.id,
    required this.email,
    this.phone,
    this.profile,
  });

  factory OrderUser.fromJson(Map<String, dynamic> json) {
    return OrderUser(
      id: json['_id'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      profile: json['profile'] != null
          ? UserProfile.fromJson(json['profile'] as Map<String, dynamic>)
          : null,
    );
  }
}

class UserProfile {
  final String? firstName;
  final String? lastName;

  UserProfile({
    this.firstName,
    this.lastName,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
    );
  }
}

class OrderLocation {
  final List<double> coordinates; // [longitude, latitude]
  final String? name;
  final String? address;

  OrderLocation({
    required this.coordinates,
    this.name,
    this.address,
  });

  factory OrderLocation.fromJson(Map<String, dynamic> json) {
    return OrderLocation(
      coordinates: (json['coordinates'] as List<dynamic>)
          .map((e) => (e as num).toDouble())
          .toList(),
      name: json['name'] as String?,
      address: json['address'] as String?,
    );
  }

  double get longitude => coordinates[0];
  double get latitude => coordinates[1];
}
