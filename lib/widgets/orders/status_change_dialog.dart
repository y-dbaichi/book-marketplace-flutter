// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Status Change Dialog Widget
///
/// Reusable dialog for changing order status with seller notes.
/// Follows Single Responsibility Principle by handling only UI concerns.
///
/// **Responsibilities:**
/// - Display available status transitions
/// - Collect optional seller notes
/// - Return selected status and notes to caller
///
/// **Usage:**
/// ```dart
/// final result = await StatusChangeDialog.show(
///   context: context,
///   order: order,
/// );
///
/// if (result != null) {
///   await orderService.updateOrderStatus(
///     order.id,
///     result.newStatus,
///     notes: result.notes,
///   );
/// }
/// ```
library;

import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../utils/app_strings.dart';

/// Result of status change dialog
class StatusChangeResult {
  final String newStatus;
  final String? notes;

  const StatusChangeResult({
    required this.newStatus,
    this.notes,
  });
}

/// Reusable status change dialog
///
/// Single responsibility: Display UI for status change workflow
class StatusChangeDialog extends StatelessWidget {
  final Order order;
  final Map<String, String> availableStatuses;

  const StatusChangeDialog({
    super.key,
    required this.order,
    required this.availableStatuses,
  });

  /// Show status change dialog
  ///
  /// Returns StatusChangeResult if user confirms, null if cancelled
  static Future<StatusChangeResult?> show({
    required BuildContext context,
    required Order order,
  }) async {
    // Get available transitions
    final availableStatuses = _getAvailableTransitions(order.status);

    if (availableStatuses.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Aucun changement de statut disponible'),
          backgroundColor: Colors.orange,
        ),
      );
      return null;
    }

    // Show status selection
    final selectedStatus = await showDialog<String>(
      context: context,
      builder: (context) => StatusChangeDialog(
        order: order,
        availableStatuses: availableStatuses,
      ),
    );

    if (selectedStatus == null) return null;

    // Show notes dialog
    final notes = await _showNotesDialog(context);
    if (notes == null) return null; // User cancelled

    return StatusChangeResult(
      newStatus: selectedStatus,
      notes: notes.isEmpty ? null : notes,
    );
  }

  /// Get available status transitions
  static Map<String, String> _getAvailableTransitions(String currentStatus) {
    final Map<String, String> transitions = {};

    if (currentStatus == 'pending') {
      transitions['confirmed'] = '✅ Confirmer la commande';
      transitions['refused'] = '❌ Refuser la commande';
    } else if (currentStatus == 'confirmed') {
      transitions['delivered'] = '📦 Marquer comme livrée';
      transitions['refused'] = '❌ Refuser';
    }

    return transitions;
  }

  /// Show seller notes input dialog
  static Future<String?> _showNotesDialog(BuildContext context) async {
    final notesController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ajouter une note (optionnel)'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Voulez-vous ajouter une note pour le client ?',
              style: TextStyle(color: Colors.grey[700]),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                hintText: 'Ex: Livraison prévue demain...',
                border: OutlineInputBorder(),
                labelText: 'Note du vendeur',
              ),
              maxLines: 3,
              maxLength: 500,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Continuer'),
          ),
        ],
      ),
    );

    return confirmed == true ? notesController.text.trim() : null;
  }

  /// Get button color for status
  static Color getStatusButtonColor(String status) {
    switch (status) {
      case 'delivered':
        return Colors.green;
      case 'confirmed':
        return Colors.blue;
      case 'refused':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  /// Build success message for status change
  static String buildSuccessMessage(String status, String bookTitle) {
    switch (status) {
      case 'confirmed':
        return '✅ $bookTitle confirmée et prête à livrer';
      case 'delivered':
        return '📦 $bookTitle marquée comme livrée';
      case 'refused':
        return '❌ $bookTitle refusée';
      default:
        return 'Statut mis à jour';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Changer le statut de "${order.book.title}"'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current status
          Text(
            'Statut actuel: ${order.statusDisplay}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Choisissez le nouveau statut:'),
          const SizedBox(height: 12),

          // Status option buttons
          ...availableStatuses.entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, entry.key),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  backgroundColor: getStatusButtonColor(entry.key),
                  foregroundColor: Colors.white,
                ),
                child: Text(entry.value),
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
      ],
    );
  }
}
