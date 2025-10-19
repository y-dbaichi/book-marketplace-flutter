// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Order Status Business Logic Helper
///
/// Centralized business logic for order status management.
/// Follows Single Responsibility Principle by handling only status-related logic.
///
/// **Responsibilities:**
/// - Define status transition rules
/// - Provide status colors for UI
/// - Provide status icons for UI
/// - Build status display labels
/// - Validate status changes
///
/// **Does NOT:**
/// - Make API calls (that's OrderService's job)
/// - Render UI (that's widgets' job)
/// - Manage state (that's pages' job)
///
/// **Usage:**
/// ```dart
/// final color = OrderStatusHelper.getColor('confirmed');
/// final icon = OrderStatusHelper.getIcon('delivered');
/// final canChange = OrderStatusHelper.canChangeStatus('delivered');
/// ```
library;

import 'package:flutter/material.dart';

/// Order status business logic helper
///
/// Single responsibility: Manage order status rules and display logic
class OrderStatusHelper {
  // Private constructor to prevent instantiation
  OrderStatusHelper._();

  // ==========================================================================
  // STATUS CONSTANTS
  // ==========================================================================

  static const String statusPending = 'pending';
  static const String statusConfirmed = 'confirmed';
  static const String statusDelivered = 'delivered';
  static const String statusRefused = 'refused';

  // ==========================================================================
  // STATUS TRANSITION LOGIC
  // ==========================================================================

  /// Get available status transitions for current status
  ///
  /// Business rules:
  /// - pending → confirmed OR refused
  /// - confirmed → delivered OR refused
  /// - delivered → NO CHANGES (final state)
  /// - refused → NO CHANGES (final state)
  ///
  /// Returns:
  /// Map of available status codes to display labels
  static Map<String, String> getAvailableTransitions(String currentStatus) {
    final Map<String, String> transitions = {};

    switch (currentStatus) {
      case statusPending:
        transitions[statusConfirmed] = '✅ Confirmer la commande';
        transitions[statusRefused] = '❌ Refuser la commande';
        break;

      case statusConfirmed:
        transitions[statusDelivered] = '📦 Marquer comme livrée';
        transitions[statusRefused] = '❌ Refuser';
        break;

      case statusDelivered:
      case statusRefused:
        // Final states - no transitions available
        break;
    }

    return transitions;
  }

  /// Check if status can be changed
  ///
  /// Returns true if status is not in a final state
  static bool canChangeStatus(String currentStatus) {
    return getAvailableTransitions(currentStatus).isNotEmpty;
  }

  /// Check if status change is valid
  ///
  /// Returns true if transition from currentStatus to newStatus is allowed
  static bool isValidTransition(String currentStatus, String newStatus) {
    final available = getAvailableTransitions(currentStatus);
    return available.containsKey(newStatus);
  }

  // ==========================================================================
  // UI DISPLAY HELPERS
  // ==========================================================================

  /// Get color for order status
  ///
  /// Color coding:
  /// - pending: orange (awaiting action)
  /// - confirmed: blue (ready to deliver)
  /// - delivered: green (completed)
  /// - refused: red (rejected)
  /// - unknown: grey
  static Color getColor(String status) {
    switch (status) {
      case statusPending:
        return Colors.orange;
      case statusConfirmed:
        return Colors.blue;
      case statusDelivered:
        return Colors.green;
      case statusRefused:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  /// Get icon for order status
  ///
  /// Icon mapping:
  /// - pending: schedule (clock)
  /// - confirmed: check_circle_outline (outlined check)
  /// - delivered: check_circle (filled check)
  /// - refused: cancel (X)
  /// - unknown: help_outline (question mark)
  static IconData getIcon(String status) {
    switch (status) {
      case statusPending:
        return Icons.schedule;
      case statusConfirmed:
        return Icons.check_circle_outline;
      case statusDelivered:
        return Icons.check_circle;
      case statusRefused:
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  /// Get French display label for status
  ///
  /// Returns user-friendly French label
  static String getDisplayLabel(String status) {
    switch (status) {
      case statusPending:
        return 'En attente';
      case statusConfirmed:
        return 'Confirmée';
      case statusDelivered:
        return 'Livrée';
      case statusRefused:
        return 'Refusée';
      default:
        return 'Inconnu';
    }
  }

  /// Get filter text for empty state based on status filter
  ///
  /// Returns appropriate French text for "no orders" message
  static String getFilterEmptyText(String filterStatus) {
    switch (filterStatus) {
      case statusConfirmed:
        return 'à livrer';
      case statusDelivered:
        return 'livrée';
      case statusPending:
        return 'en attente';
      default:
        return 'trouvée';
    }
  }

  // ==========================================================================
  // STATUS CHANGE MESSAGES
  // ==========================================================================

  /// Build success message for status change
  ///
  /// Creates user-friendly message based on new status
  ///
  /// Parameters:
  /// - [newStatus]: The status the order was changed to
  /// - [bookTitle]: Title of the book (for personalized message)
  ///
  /// Returns:
  /// Success message with emoji
  static String buildSuccessMessage(String newStatus, String bookTitle) {
    switch (newStatus) {
      case statusConfirmed:
        return '✅ $bookTitle confirmée et prête à livrer';
      case statusDelivered:
        return '📦 $bookTitle marquée comme livrée';
      case statusRefused:
        return '❌ $bookTitle refusée';
      default:
        return 'Statut mis à jour';
    }
  }

  /// Get action button label for status
  ///
  /// Used for quick action buttons on order cards
  static String getActionLabel(String currentStatus) {
    switch (currentStatus) {
      case statusPending:
        return '✅ Confirmer';
      case statusConfirmed:
        return '📦 Livrer';
      default:
        return 'Modifier';
    }
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /// Check if all orders can be delivered
  ///
  /// Returns true if all orders are in confirmed status
  static bool canDeliverAll(List<String> orderStatuses) {
    return orderStatuses.every((status) => status == statusConfirmed);
  }

  /// Filter orders by status
  ///
  /// Helper for filtering order lists
  static List<T> filterByStatus<T>(
    List<T> orders,
    String targetStatus,
    String Function(T) getStatus,
  ) {
    return orders.where((order) => getStatus(order) == targetStatus).toList();
  }

  /// Count orders by status
  ///
  /// Returns map of status → count
  static Map<String, int> countByStatus<T>(
    List<T> orders,
    String Function(T) getStatus,
  ) {
    final Map<String, int> counts = {
      statusPending: 0,
      statusConfirmed: 0,
      statusDelivered: 0,
      statusRefused: 0,
    };

    for (final order in orders) {
      final status = getStatus(order);
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return counts;
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /// Validate status value
  ///
  /// Returns true if status is one of the known statuses
  static bool isValidStatus(String status) {
    return [
      statusPending,
      statusConfirmed,
      statusDelivered,
      statusRefused,
    ].contains(status);
  }
}
