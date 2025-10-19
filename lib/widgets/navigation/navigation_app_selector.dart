// Copyright 2025 Yassine Dbaichi
// Licensed under MIT License

/// Navigation App Selector Widget
///
/// Reusable bottom sheet for selecting navigation app (Google Maps or Waze).
/// Single responsibility: Display navigation app options and launch selected app.
///
/// **Features:**
/// - Google Maps with full route (all waypoints)
/// - Waze to final destination (uses device GPS)
/// - App installation prompts if not installed
///
/// **Usage:**
/// ```dart
/// NavigationAppSelector.show(
///   context: context,
///   startPoint: LatLng(...),
///   orders: confirmedOrders,
/// );
/// ```
library;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/order.dart';
import '../../utils/app_strings.dart';

/// Navigation app selector bottom sheet
///
/// Single responsibility: UI for selecting and launching navigation apps
class NavigationAppSelector {
  /// Show navigation app selector bottom sheet
  static void show({
    required BuildContext context,
    required LatLng? startPoint,
    required List<Order> orders,
  }) {
    if (startPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppStrings.tourCalculateFirst),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppStrings.navChooseApp,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Google Maps Option
            _buildAppCard(
              icon: Icons.map,
              iconColor: Colors.green[700]!,
              title: AppStrings.navGoogleMaps,
              description: AppStrings.navGoogleMapsDesc,
              onTap: () {
                Navigator.pop(context);
                _openGoogleMaps(context, startPoint, orders);
              },
            ),
            const SizedBox(height: 12),

            // Waze Option
            _buildAppCard(
              icon: Icons.navigation,
              iconColor: Colors.blue[700]!,
              title: AppStrings.navWaze,
              description: AppStrings.navWazeDesc,
              onTap: () {
                Navigator.pop(context);
                _openWaze(context, orders);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  /// Build navigation app option card
  static Widget _buildAppCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    description,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  /// Open Google Maps with full route
  static Future<void> _openGoogleMaps(
    BuildContext context,
    LatLng startPoint,
    List<Order> orders,
  ) async {
    if (orders.isEmpty) return;

    // Build Google Maps URL with multiple waypoints
    final StringBuffer urlBuffer = StringBuffer();
    urlBuffer.write('https://www.google.com/maps/dir/?api=1');

    // Origin (starting point)
    urlBuffer.write('&origin=${startPoint.latitude},${startPoint.longitude}');

    // Waypoints (all deliveries except the last one)
    if (orders.length > 1) {
      urlBuffer.write('&waypoints=');
      for (int i = 0; i < orders.length - 1; i++) {
        final loc = orders[i].buyerLocation;
        if (loc != null) {
          if (i > 0) urlBuffer.write('|');
          urlBuffer.write('${loc.latitude},${loc.longitude}');
        }
      }
    }

    // Destination (last delivery)
    final lastLoc = orders.last.buyerLocation;
    if (lastLoc != null) {
      urlBuffer.write('&destination=${lastLoc.latitude},${lastLoc.longitude}');
    }

    urlBuffer.write('&travelmode=driving');

    final Uri googleMapsUri = Uri.parse(urlBuffer.toString());

    try {
      if (await canLaunchUrl(googleMapsUri)) {
        await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Cannot launch Google Maps');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.navGoogleMapsNotInstalled),
            action: SnackBarAction(
              label: AppStrings.navInstall,
              onPressed: () async {
                final Uri playStoreUri = Uri.parse(
                  'https://play.google.com/store/apps/details?id=com.google.android.apps.maps',
                );
                await launchUrl(playStoreUri, mode: LaunchMode.externalApplication);
              },
            ),
          ),
        );
      }
    }
  }

  /// Open Waze to final destination
  static Future<void> _openWaze(BuildContext context, List<Order> orders) async {
    if (orders.isEmpty) return;

    // Waze doesn't support multiple waypoints
    // Navigate to final destination
    final lastLoc = orders.last.buyerLocation;
    if (lastLoc == null) return;

    // Waze deep link format
    final Uri wazeUri = Uri.parse(
      'https://waze.com/ul?ll=${lastLoc.latitude},${lastLoc.longitude}&navigate=yes',
    );

    try {
      if (await canLaunchUrl(wazeUri)) {
        await launchUrl(wazeUri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Cannot launch Waze');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.navWazeNotInstalled),
            action: SnackBarAction(
              label: AppStrings.navInstall,
              onPressed: () async {
                final Uri playStoreUri = Uri.parse(
                  'https://play.google.com/store/apps/details?id=com.waze',
                );
                await launchUrl(playStoreUri, mode: LaunchMode.externalApplication);
              },
            ),
          ),
        );
      }
    }
  }
}
