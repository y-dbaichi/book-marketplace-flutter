// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Order Detail Display Widget
///
/// Reusable component for displaying complete order information.
/// Supports both dialog and bottom sheet display modes.
///
/// **Single Responsibility:** Display order details in a consistent format
///
/// **Features:**
/// - Displays all order information (book, buyer, location, notes)
/// - Supports custom action buttons
/// - Optional stop number display (for route planning)
/// - Flexible display mode (dialog or bottom sheet)
///
/// **Usage:**
/// ```dart
/// // Show as bottom sheet (for tour page)
/// OrderDetailBottomSheet.showBottomSheet(
///   context: context,
///   order: order,
///   stopNumber: 1,
///   onNavigate: () => _navigate(order),
///   onCall: () => _call(order),
///   onChangeStatus: () => _changeStatus(order),
/// );
///
/// // Show as dialog (for order list)
/// OrderDetailBottomSheet.showAsDialog(
///   context: context,
///   order: order,
///   onChangeStatus: () => _changeStatus(order),
/// );
/// ```
library;

import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../helpers/order_status_helper.dart';

/// Reusable order detail display widget
///
/// Single responsibility: Display order information in a standardized format
class OrderDetailBottomSheet extends StatelessWidget {
  final Order order;
  final int? stopNumber;
  final VoidCallback? onNavigate;
  final VoidCallback? onCall;
  final VoidCallback? onChangeStatus;
  final VoidCallback? onClose;

  const OrderDetailBottomSheet({
    super.key,
    required this.order,
    this.stopNumber,
    this.onNavigate,
    this.onCall,
    this.onChangeStatus,
    this.onClose,
  });

  /// Show order details as a draggable bottom sheet
  ///
  /// **Best for:** Tour planning page (includes navigation actions)
  ///
  /// Parameters:
  /// - [stopNumber]: Optional stop number to display
  /// - [onNavigate]: Callback for navigation button
  /// - [onCall]: Callback for call button
  /// - [onChangeStatus]: Callback for status change button
  static Future<void> showBottomSheet({
    required BuildContext context,
    required Order order,
    int? stopNumber,
    VoidCallback? onNavigate,
    VoidCallback? onCall,
    VoidCallback? onChangeStatus,
  }) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: OrderDetailBottomSheet(
            order: order,
            stopNumber: stopNumber,
            onNavigate: onNavigate,
            onCall: onCall,
            onChangeStatus: onChangeStatus,
            onClose: () => Navigator.pop(context),
          ),
        ),
      ),
    );
  }

  /// Show order details as an alert dialog
  ///
  /// **Best for:** Order list page (simple display with minimal actions)
  ///
  /// Parameters:
  /// - [onChangeStatus]: Optional callback for status change button
  static Future<void> showAsDialog({
    required BuildContext context,
    required Order order,
    VoidCallback? onChangeStatus,
  }) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              OrderStatusHelper.getIcon(order.status),
              color: OrderStatusHelper.getColor(order.status),
            ),
            const SizedBox(width: 8),
            const Text('Détails de la commande'),
          ],
        ),
        content: SingleChildScrollView(
          child: OrderDetailBottomSheet(
            order: order,
            onChangeStatus: onChangeStatus != null
                ? () {
                    Navigator.pop(context);
                    onChangeStatus();
                  }
                : null,
          ),
        ),
        actions: [
          if (onChangeStatus != null &&
              order.status != OrderStatusHelper.statusDelivered &&
              order.status != OrderStatusHelper.statusRefused)
            TextButton.icon(
              onPressed: () {
                Navigator.pop(context);
                onChangeStatus();
              },
              icon: const Icon(Icons.swap_horiz),
              label: const Text('Changer statut'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Header with stop number (if in tour mode)
        if (stopNumber != null) _buildTourHeader(context),

        // Book information
        if (stopNumber == null) ...[
          _buildDetailRow(
            icon: Icons.book,
            label: 'Livre',
            value: order.book.title,
          ),
          _buildDetailRow(
            icon: Icons.person,
            label: 'Auteur',
            value: order.book.author,
          ),
        ],

        // Customer information
        _buildDetailRow(
          icon: Icons.account_circle,
          label: 'Client',
          value: order.buyerName,
        ),
        _buildDetailRow(
          icon: Icons.phone,
          label: 'Téléphone',
          value: order.buyer.phone ?? 'N/A',
        ),

        // Order details
        _buildDetailRow(
          icon: Icons.numbers,
          label: 'Quantité',
          value: order.quantity.toString(),
        ),
        _buildDetailRow(
          icon: Icons.attach_money,
          label: 'Prix total',
          value: '${order.totalPrice.toStringAsFixed(2)} MAD',
        ),

        // Status (only in dialog mode)
        if (stopNumber == null)
          _buildDetailRow(
            icon: Icons.info,
            label: 'Statut',
            value: order.statusDisplay,
          ),

        // Location information
        if (order.buyerLocation != null) ...[
          const Divider(height: 24),
          _buildDetailRow(
            icon: Icons.location_on,
            label: 'Adresse',
            value: order.buyerLocation!.address ?? 'N/A',
          ),
          if (stopNumber == null)
            _buildDetailRow(
              icon: Icons.map,
              label: 'Coordonnées',
              value:
                  '${order.buyerLocation!.latitude.toStringAsFixed(6)}, ${order.buyerLocation!.longitude.toStringAsFixed(6)}',
            ),
        ],

        // Buyer notes
        if (order.buyerNotes != null) ...[
          const Divider(height: 24),
          Text(
            'Notes du client:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(order.buyerNotes!),
          ),
        ],

        // Seller notes (only in dialog mode)
        if (stopNumber == null && order.sellerNotes != null) ...[
          const Divider(height: 24),
          const Text(
            'Mes notes:',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            order.sellerNotes!,
            style: const TextStyle(fontStyle: FontStyle.italic),
          ),
        ],

        // Action buttons (for tour mode)
        if (stopNumber != null) ...[
          const SizedBox(height: 24),
          _buildActionButtons(context),
        ],
      ],
    );
  }

  /// Build header for tour mode (with stop number and book info)
  Widget _buildTourHeader(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Text(
                '$stopNumber',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.book.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Par ${order.book.author}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            if (onClose != null)
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: onClose,
              ),
          ],
        ),
        const Divider(height: 32),
      ],
    );
  }

  /// Build a detail row with icon, label, and value
  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build action buttons for tour mode
  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        // Primary action: Navigate
        if (onNavigate != null)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onNavigate,
              icon: const Icon(Icons.navigation, size: 24),
              label: const Text(
                'Démarrer la navigation',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        const SizedBox(height: 12),

        // Secondary actions: Call and Status
        Row(
          children: [
            if (onCall != null)
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onCall,
                  icon: const Icon(Icons.phone),
                  label: const Text('Appeler'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            if (onCall != null && onChangeStatus != null) const SizedBox(width: 12),
            if (onChangeStatus != null)
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onChangeStatus,
                  icon: const Icon(Icons.swap_horiz),
                  label: const Text('Statut'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
