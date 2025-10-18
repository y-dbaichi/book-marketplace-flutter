// ==============================================================================
// ORDER SERVICE
// ==============================================================================
// Singleton service for managing seller order operations
// Handles fetching orders, updating order status, and filtering by status
//
// Features:
// - Fetch all seller orders with optional status filtering
// - Update order status (confirm, deliver, refuse)
// - Convenience methods for common order queries
// - French error messages for user-friendly feedback
// - Comprehensive error handling
//
// Order Status Flow:
// pending → confirmed → delivered
//         ↘ refused
//
// Flutter App User: Sellers only
// - Sellers can view orders placed by buyers
// - Sellers can update order status for deliveries
// ==============================================================================

import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../utils/constants.dart';
import 'api_service.dart';

// ==============================================================================
// ORDER SERVICE CLASS
// ==============================================================================

/// Service for managing seller order operations
///
/// Implements the Singleton pattern to ensure consistent state across
/// the application. Provides methods for fetching and updating orders
/// with automatic authentication via ApiService.
///
/// Order Management:
/// - View all orders or filter by status (pending/confirmed/delivered/refused)
/// - Update order status through the full lifecycle
/// - French error messages for sellers
///
/// Usage:
/// ```dart
/// final orderService = OrderService();
/// final orders = await orderService.getSellerOrders();
/// final confirmedOrders = await orderService.getOrdersToDeliver();
/// await orderService.markAsDelivered(orderId, notes: 'Livré avec succès');
/// ```
class OrderService {
  // ===========================================================================
  // SINGLETON PATTERN
  // ===========================================================================

  /// Private static instance for singleton pattern
  static final OrderService _instance = OrderService._internal();

  /// API service for making HTTP requests
  final ApiService _api = ApiService();

  /// Private constructor for singleton pattern
  OrderService._internal();

  /// Factory constructor returns the singleton instance
  factory OrderService() => _instance;

  // ===========================================================================
  // ORDER FETCHING METHODS
  // ===========================================================================

  /// Get all seller orders with optional status filtering
  ///
  /// Fetches all orders for the currently authenticated seller.
  /// The seller is determined by the JWT token in the request headers.
  ///
  /// Parameters:
  /// - [status]: Optional filter by order status ('pending', 'confirmed', 'delivered', 'refused')
  ///
  /// Returns:
  /// - List of Order objects
  ///
  /// Throws:
  /// - Exception on network errors or API errors
  ///
  /// Example:
  /// ```dart
  /// // Get all orders
  /// final allOrders = await getSellerOrders();
  ///
  /// // Get only confirmed orders
  /// final confirmedOrders = await getSellerOrders(status: 'confirmed');
  /// ```
  Future<List<Order>> getSellerOrders({String? status}) async {
    debugPrint('📦 Fetching seller orders${status != null ? ' (status: $status)' : ''}...');

    try {
      // Prepare query parameters
      final queryParams = status != null ? {'status': status} : null;

      // Make API request
      final response = await _api.get(
        AppConstants.sellerOrdersEndpoint,
        queryParameters: queryParams,
      );

      // Parse response data
      final List<dynamic> ordersData = response.data['orders'];
      final orders = ordersData.map((o) => Order.fromJson(o)).toList();

      debugPrint('✅ Fetched ${orders.length} orders');
      return orders;
    } catch (e) {
      debugPrint('❌ Failed to fetch seller orders: $e');
      rethrow;
    }
  }

  /// Get orders that need delivery (confirmed status)
  ///
  /// Convenience method for fetching orders that have been confirmed
  /// and are ready for delivery by the seller.
  ///
  /// Returns:
  /// - List of Order objects with status 'confirmed'
  Future<List<Order>> getOrdersToDeliver() async {
    return getSellerOrders(status: 'confirmed');
  }

  /// Get delivered orders
  ///
  /// Convenience method for fetching orders that have been delivered.
  /// Useful for viewing delivery history.
  ///
  /// Returns:
  /// - List of Order objects with status 'delivered'
  Future<List<Order>> getDeliveredOrders() async {
    return getSellerOrders(status: 'delivered');
  }

  /// Get pending orders
  ///
  /// Convenience method for fetching orders awaiting confirmation.
  /// These are newly placed orders that the seller needs to review.
  ///
  /// Returns:
  /// - List of Order objects with status 'pending'
  Future<List<Order>> getPendingOrders() async {
    return getSellerOrders(status: 'pending');
  }

  // ===========================================================================
  // ORDER STATUS UPDATE METHODS
  // ===========================================================================

  /// Mark order as delivered
  ///
  /// Updates the order status to 'delivered'. This indicates the seller
  /// has successfully delivered the books to the buyer.
  ///
  /// Parameters:
  /// - [orderId]: ID of the order to mark as delivered
  /// - [notes]: Optional delivery notes (e.g., "Livré au domicile", "Signé par le client")
  ///
  /// Returns:
  /// - Updated Order object with new status
  ///
  /// Throws:
  /// - Exception with French error message on failure
  ///   - 404: Order not found
  ///   - 400: Invalid status transition (e.g., trying to deliver a refused order)
  ///   - Other: Generic error message
  Future<Order> markAsDelivered(String orderId, {String? notes}) async {
    debugPrint('📦 Marking order $orderId as delivered...');

    try {
      // Prepare request data
      final data = {
        'status': 'delivered',
        if (notes != null) 'notes': notes,
      };

      // Make API request
      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      // Parse response
      final order = Order.fromJson(response.data['order']);
      debugPrint('✅ Order marked as delivered');
      return order;
    } catch (e) {
      debugPrint('❌ Failed to mark order as delivered: $e');

      // Provide user-friendly French error messages
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de marquer comme livrée. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors de la mise à jour du statut');
    }
  }

  /// Confirm order
  ///
  /// Updates the order status to 'confirmed'. This indicates the seller
  /// has accepted the order and will prepare it for delivery.
  ///
  /// Status transition: pending → confirmed
  ///
  /// Parameters:
  /// - [orderId]: ID of the order to confirm
  /// - [notes]: Optional confirmation notes (e.g., "Préparation en cours", "Prêt demain")
  ///
  /// Returns:
  /// - Updated Order object with new status
  ///
  /// Throws:
  /// - Exception with French error message on failure
  ///   - 404: Order not found
  ///   - 400: Invalid status transition
  ///   - Other: Generic error message
  Future<Order> confirmOrder(String orderId, {String? notes}) async {
    debugPrint('📦 Confirming order $orderId...');

    try {
      // Prepare request data
      final data = {
        'status': 'confirmed',
        if (notes != null) 'notes': notes,
      };

      // Make API request
      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      // Parse response
      final order = Order.fromJson(response.data['order']);
      debugPrint('✅ Order confirmed');
      return order;
    } catch (e) {
      debugPrint('❌ Failed to confirm order: $e');

      // Provide user-friendly French error messages
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de confirmer. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors de la confirmation');
    }
  }

  /// Refuse order
  ///
  /// Updates the order status to 'refused'. This indicates the seller
  /// cannot fulfill the order (e.g., out of stock, unavailable).
  ///
  /// Status transition: pending → refused
  ///
  /// Parameters:
  /// - [orderId]: ID of the order to refuse
  /// - [notes]: Optional refusal reason (e.g., "Rupture de stock", "Livre non disponible")
  ///
  /// Returns:
  /// - Updated Order object with new status
  ///
  /// Throws:
  /// - Exception with French error message on failure
  ///   - 404: Order not found
  ///   - 400: Invalid status transition
  ///   - Other: Generic error message
  Future<Order> refuseOrder(String orderId, {String? notes}) async {
    debugPrint('📦 Refusing order $orderId...');

    try {
      // Prepare request data
      final data = {
        'status': 'refused',
        if (notes != null) 'notes': notes,
      };

      // Make API request
      final response = await _api.put(
        '${AppConstants.ordersEndpoint}/$orderId/status',
        data: data,
      );

      // Parse response
      final order = Order.fromJson(response.data['order']);
      debugPrint('✅ Order refused');
      return order;
    } catch (e) {
      debugPrint('❌ Failed to refuse order: $e');

      // Provide user-friendly French error messages
      if (e.toString().contains('404')) {
        throw Exception('Commande non trouvée');
      } else if (e.toString().contains('400')) {
        throw Exception('Impossible de refuser. Vérifiez le statut actuel.');
      }
      throw Exception('Erreur lors du refus');
    }
  }

  /// Update order status dynamically
  ///
  /// Generic method for updating order status. Routes to the appropriate
  /// specialized method based on the target status.
  ///
  /// Parameters:
  /// - [orderId]: ID of the order to update
  /// - [status]: Target status ('confirmed', 'delivered', 'refused')
  /// - [notes]: Optional notes for the status update
  ///
  /// Returns:
  /// - Updated Order object with new status
  ///
  /// Throws:
  /// - Exception if status is invalid
  /// - Exception from the specific update method on failure
  ///
  /// Example:
  /// ```dart
  /// // Equivalent to confirmOrder(orderId)
  /// await updateOrderStatus(orderId, 'confirmed', notes: 'OK');
  ///
  /// // Equivalent to markAsDelivered(orderId)
  /// await updateOrderStatus(orderId, 'delivered', notes: 'Livré');
  /// ```
  Future<Order> updateOrderStatus(
    String orderId,
    String status, {
    String? notes,
  }) async {
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
