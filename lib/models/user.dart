class User {
  final String id;
  final String email;
  final String userType;
  final String? phone;
  final UserProfile? profile;
  final UserLocation? location;

  User({
    required this.id,
    required this.email,
    required this.userType,
    this.phone,
    this.profile,
    this.location,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      userType: json['userType'] ?? 'buyer',
      phone: json['phone'],
      profile: json['profile'] != null ? UserProfile.fromJson(json['profile']) : null,
      location: json['location'] != null ? UserLocation.fromJson(json['location']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'userType': userType,
      'phone': phone,
      'profile': profile?.toJson(),
      'location': location?.toJson(),
    };
  }

  String get displayName {
    if (profile?.firstName != null && profile?.lastName != null) {
      return '${profile!.firstName} ${profile!.lastName}';
    }
    return email;
  }
}

class UserProfile {
  final String? firstName;
  final String? lastName;
  final String? bio;

  UserProfile({this.firstName, this.lastName, this.bio});

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      firstName: json['firstName'],
      lastName: json['lastName'],
      bio: json['bio'],
    );
  }

  Map<String, dynamic> toJson() {
    return {'firstName': firstName, 'lastName': lastName, 'bio': bio};
  }
}

class UserLocation {
  final String? name;
  final Coordinates? coordinates;
  final String? address;

  UserLocation({this.name, this.coordinates, this.address});

  factory UserLocation.fromJson(Map<String, dynamic> json) {
    return UserLocation(
      name: json['name'],
      coordinates: json['coordinates'] != null ? Coordinates.fromJson(json['coordinates']) : null,
      address: json['address'],
    );
  }

  Map<String, dynamic> toJson() {
    return {'name': name, 'coordinates': coordinates?.toJson(), 'address': address};
  }
}

class Coordinates {
  final double latitude;
  final double longitude;

  Coordinates({required this.latitude, required this.longitude});

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'latitude': latitude, 'longitude': longitude};
  }
}
