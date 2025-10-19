// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Order Selection List Item Widget
///
/// Reusable component for displaying selectable orders in lists.
/// Used primarily for tour selection where users choose which orders to include.
///
/// **Single Responsibility:** Display a selectable order item with all relevant info
///
/// **Features:**
/// - Selection state visualization (border, background, icon)
/// - Order information display (book, customer, location)
/// - Info chips for quantity and price
/// - Tap handling for selection toggle
/// - Responsive design with proper spacing
///
/// **Usage:**
/// ```dart
/// ListView.builder(
///   itemCount: orders.length,
///   itemBuilder: (context, index) {
///     final order = orders[index];
///     return OrderSelectionListItem(
///       order: order,
///       isSelected: selectedIds.contains(order.id),
///       onTap: () => toggleSelection(order.id),
///     );
///   },
/// )
/// ```
library;

import 'package:flutter/material.dart';
import '../../models/order.dart';

/// Reusable selectable order list item widget
///
/// Single responsibility: Display order information with selection state
class OrderSelectionListItem extends StatelessWidget {
  /// The order to display
  final Order order;

  /// Whether this order is currently selected
  final bool isSelected;

  /// Callback when item is tapped
  final VoidCallback onTap;

  const OrderSelectionListItem({
    super.key,
    required this.order,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isSelected ? Colors.indigo : Colors.transparent,
            width: 2,
          ),
        ),
        color: isSelected ? Colors.indigo.withOpacity(0.05) : Colors.white,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Checkbox/Icon
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.indigo : Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isSelected ? Icons.check : Icons.location_on,
                    color: isSelected ? Colors.white : Colors.grey[600],
                  ),
                ),

                const SizedBox(width: 16),

                // Order Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Book title
                      Text(
                        order.book.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Customer name
                      Text(
                        'Client: ${order.buyerName}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),

                      // Address
                      Text(
                        order.buyerLocation?.address ?? 'Adresse non disponible',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),

                      // Info chips (quantity and price)
                      Row(
                        children: [
                          _buildInfoChip(
                            Icons.shopping_bag,
                            'Qté: ${order.quantity}',
                          ),
                          const SizedBox(width: 8),
                          _buildInfoChip(
                            Icons.attach_money,
                            '${order.totalPrice.toStringAsFixed(0)} MAD',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Build an info chip with icon and text
  ///
  /// Creates a small rounded container with an icon and text.
  /// Used for displaying quantity and price information.
  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
