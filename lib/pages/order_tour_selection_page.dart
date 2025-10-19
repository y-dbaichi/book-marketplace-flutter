// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Order Tour Selection Page
///
/// Allows sellers to select which confirmed orders to include in their
/// delivery tour route. Selected orders are then passed to the route
/// optimization engine.
///
/// **Features:**
/// - Multi-select order list with checkboxes
/// - Select All / Deselect All quick actions
/// - Displays order details (customer, book, location)
/// - Validates selection (minimum 1 order required)
/// - Pre-selects all orders by default for convenience
///
/// **User Flow:**
/// 1. View list of confirmed orders
/// 2. Toggle selection for each order
/// 3. Tap "Démarrer la tournée" button
/// 4. Navigate to [OrderTourPage] with selected orders
///
/// **Example Usage:**
/// ```dart
/// Navigator.push(
///   context,
///   MaterialPageRoute(
///     builder: (context) => OrderTourSelectionPage(
///       confirmedOrders: confirmedOrdersList,
///     ),
///   ),
/// );
/// ```
///
/// See also:
/// - [OrderTourPage] for the route planning and navigation page
/// - [Order] model for order data structure
library;

import 'package:flutter/material.dart';
import '../models/order.dart';
import '../widgets/orders/order_selection_list_item.dart';
import 'order_tour_page.dart';

/// Multi-select page for choosing orders to include in delivery tour
///
/// This page is specifically designed for sellers who have multiple
/// confirmed orders and want to plan an optimized delivery route.
/// Users can select which orders to include before the route is calculated.
class OrderTourSelectionPage extends StatefulWidget {
  final List<Order> confirmedOrders;

  const OrderTourSelectionPage({super.key, required this.confirmedOrders});

  @override
  State<OrderTourSelectionPage> createState() => _OrderTourSelectionPageState();
}

class _OrderTourSelectionPageState extends State<OrderTourSelectionPage> {
  /// Set of order IDs that are currently selected
  ///
  /// Using Set for O(1) lookup performance when checking if order is selected.
  /// Stores IDs rather than full Order objects to minimize memory usage.
  Set<String> _selectedOrderIds = {};

  @override
  void initState() {
    super.initState();
    // Pre-select all orders for convenience (user can deselect if needed)
    _selectedOrderIds = widget.confirmedOrders.map((o) => o.id).toSet();
  }

  /// Toggles selection state for a specific order
  ///
  /// If the order is currently selected, it will be deselected.
  /// If the order is not selected, it will be selected.
  ///
  /// **Parameters:**
  /// - [orderId]: The unique identifier of the order to toggle
  void _toggleSelection(String orderId) {
    setState(() {
      if (_selectedOrderIds.contains(orderId)) {
        _selectedOrderIds.remove(orderId);
      } else {
        _selectedOrderIds.add(orderId);
      }
    });
  }

  /// Selects all available orders
  ///
  /// Updates the selection set to include all orders from [widget.confirmedOrders].
  /// Useful when user wants to quickly include all orders in the tour.
  void _selectAll() {
    setState(() {
      _selectedOrderIds = widget.confirmedOrders.map((o) => o.id).toSet();
    });
  }

  /// Deselects all orders
  ///
  /// Clears the selection set completely.
  /// Useful when user wants to start selection from scratch.
  void _deselectAll() {
    setState(() {
      _selectedOrderIds.clear();
    });
  }

  /// Starts the delivery tour with selected orders
  ///
  /// **Behavior:**
  /// 1. Filters confirmed orders to only include selected ones
  /// 2. Validates that at least one order is selected
  /// 3. If valid, navigates to [OrderTourPage] with selected orders
  /// 4. If invalid, shows warning snackbar
  ///
  /// **Validation:**
  /// - Minimum 1 order required
  /// - Shows orange warning snackbar if validation fails
  void _startTour() {
    final selectedOrders = widget.confirmedOrders
        .where((o) => _selectedOrderIds.contains(o.id))
        .toList();

    if (selectedOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Veuillez sélectionner au moins une commande'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OrderTourPage(orders: selectedOrders),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final availableOrders = widget.confirmedOrders
        .where((o) => o.buyerLocation != null)
        .toList();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.indigo[600],
        foregroundColor: Colors.white,
        title: Text(
          '🎯 Planifier Tournée (${_selectedOrderIds.length}/${availableOrders.length})',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          if (availableOrders.isNotEmpty) ...[
            TextButton(
              onPressed: _selectAll,
              child: const Text(
                'Tout',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            TextButton(
              onPressed: _deselectAll,
              child: const Text(
                'Aucun',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ],
      ),
      body: Column(
        children: [
          // Header Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo[600]!, Colors.indigo[400]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.indigo.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.route, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${availableOrders.length} Commandes à Livrer',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Sélectionnez les commandes pour la tournée d\'aujourd\'hui',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _selectedOrderIds.isEmpty ? null : _startTour,
                    icon: const Icon(Icons.play_arrow),
                    label: Text('Démarrer la Tournée (${_selectedOrderIds.length})'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: availableOrders.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.route, size: 48, color: Colors.grey[400]),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Aucune commande confirmée',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Confirmez des commandes pour planifier une tournée',
                            style: TextStyle(color: Colors.grey[500]),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back),
                            label: const Text('Retour'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: availableOrders.length,
                    itemBuilder: (context, index) {
                      final order = availableOrders[index];
                      final isSelected = _selectedOrderIds.contains(order.id);

                      return OrderSelectionListItem(
                        order: order,
                        isSelected: isSelected,
                        onTap: () => _toggleSelection(order.id),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
