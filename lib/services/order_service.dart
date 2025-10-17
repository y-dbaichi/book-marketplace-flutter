import '../models/order.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class OrderService {
  static final OrderService _instance = OrderService._internal();
  final ApiService _api = ApiService();

  OrderService._internal();
  factory OrderService() => _instance;

  /// Get all seller orders
  Future<List<Order>> getSellerOrders({String? status}) async {
    print('📦 Fetching seller orders${status != null ? ' (status: $status)' : ''}...');

    try {
      final queryParams = status != null ? {'status': status} : null;
      final response = await _api.get(
        AppConstants.sellerOrdersEndpoint,
        queryParameters: queryParams,
      );

      final List<dynamic> ordersData = response.data['orders'];
      final orders = ordersData.map((o) => Order.fromJson(o)).toList();

      print('✅ Fetched ${orders.length} orders');
      return orders;
    } catch (e) {
      print('❌ Failed to fetch seller orders: $e');
      rethrow;
    }
  }

  /// Get orders that need delivery (confirmed status)
  Future<List<Order>> getOrdersToDeliver() async {
    return getSellerOrders(status: 'confirmed');
  }

  /// Get delivered orders
  Future<List<Order>> getDeliveredOrders() async {
    return getSellerOrders(status: 'delivered');
  }

  /// Get pending orders
  Future<List<Order>> getPendingOrders() async {
    return getSellerOrders(status: 'pending');
  }

  /// Mark order as delivered
  Future<Order> markAsDelivered(String orderId, {String? notes}) async {
    print('📦 Marking order $orderId as delivered...');

    try {
      final data = {
        'status': 'delivered',
        if (notes != null) 'notes': notes,
      };

      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      final order = Order.fromJson(response.data['order']);
      print('✅ Order marked as delivered');
      return order;
    } catch (e) {
      print('❌ Failed to mark order as delivered: $e');
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de marquer comme livrée. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors de la mise à jour du statut');
    }
  }

  /// Confirm order
  Future<Order> confirmOrder(String orderId, {String? notes}) async {
    print('📦 Confirming order $orderId...');

    try {
      final data = {
        'status': 'confirmed',
        if (notes != null) 'notes': notes,
      };

      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      final order = Order.fromJson(response.data['order']);
      print('✅ Order confirmed');
      return order;
    } catch (e) {
      print('❌ Failed to confirm order: $e');
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de confirmer. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors de la confirmation');
    }
  }

  /// Refuse order
  Future<Order> refuseOrder(String orderId, {String? notes}) async {
    print('📦 Refusing order $orderId...');

    try {
      final data = {
        'status': 'refused',
        if (notes != null) 'notes': notes,
      };

      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      final order = Order.fromJson(response.data['order']);
      print('✅ Order refused');
      return order;
    } catch (e) {
      print('❌ Failed to refuse order: $e');
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de refuser. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors du refus');
    }
  }

  /// Update order status
  Future<Order> updateOrderStatus(String orderId, String status, {String? notes}) async {
    switch (status) {
      case 'confirmed':
        return confirmOrder(orderId, notes: notes);
      case 'delivered':
        return markAsDelivered(orderId, notes: notes);
      case 'refused':
        return refuseOrder(orderId, notes: notes);
      default:
        throw Exception('Invalid status: $status');
    }
  }
}
