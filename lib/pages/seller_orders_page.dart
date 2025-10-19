// ==============================================================================
// SELLER ORDERS PAGE
// ==============================================================================
// Main dashboard for sellers to manage their book delivery orders
// This is the primary interface for viewing, filtering, and updating orders
//
// Features:
// - Tab-based order filtering (All, To Deliver, Delivered, Pending)
// - Pull-to-refresh functionality
// - Order status updates with confirmation dialogs
// - Seller notes for each status change
// - Order details dialog with complete information
// - Map view for confirmed orders
// - Route planning for deliveries
// - Logout functionality
// - Real-time order count in tabs
//
// Architecture:
// - StatefulWidget with SingleTickerProviderStateMixin for TabController
// - AuthService for user info and logout
// - OrderService for fetching and updating orders
// - Navigator for page transitions
// - Material 3 design with cards and dialogs
//
// Order Status Flow:
// pending → confirmed → delivered
//         ↘ refused
//
// User Flow:
// 1. View orders in tab-based interface
// 2. Filter by status using tabs
// 3. Tap order to view details
// 4. Change order status with notes
// 5. View confirmed orders on map
// 6. Plan delivery route
//
// Performance:
// - RefreshIndicator for pull-to-refresh
// - ListView.builder for efficient rendering
// - Automatic order reload after status changes
// ==============================================================================

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/order_service.dart';
import '../models/order.dart';
import '../helpers/order_status_helper.dart';
import '../widgets/orders/status_change_dialog.dart';
import '../utils/error_utils.dart';
import 'login_page.dart';
import 'order_map_page.dart';
import 'order_tour_selection_page.dart';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/// Number of tabs in the TabBar
const int _kTabCount = 4;

/// Tab index for "All orders"
const int _kAllTabIndex = 0;

/// Tab index for "To Deliver" (confirmed)
const int _kConfirmedTabIndex = 1;

/// Tab index for "Delivered"
const int _kDeliveredTabIndex = 2;

/// Tab index for "Pending"
const int _kPendingTabIndex = 3;

/// Icon size for empty state
const double _kEmptyIconSize = 64.0;

/// Icon size for error state
const double _kErrorIconSize = 64.0;

/// Spacing between major elements
const double _kMajorSpacing = 16.0;

/// Spacing between small elements
const double _kSmallSpacing = 8.0;

/// Spacing between tiny elements
const double _kTinySpacing = 4.0;

/// Spacing between FABs
const double _kFabSpacing = 12.0;

/// Card margin (vertical)
const double _kCardMargin = 4.0;

/// List padding
const double _kListPadding = 8.0;

/// Dialog content padding
const double _kDialogPadding = 4.0;

/// Dialog button minimum height
const double _kDialogButtonHeight = 48.0;

/// Seller notes maximum length
const int _kMaxSellerNotesLength = 500;

/// Detail row vertical padding
const double _kDetailRowPadding = 4.0;

/// Detail row icon size
const double _kDetailRowIconSize = 16.0;

/// "Exception: " prefix length for error message cleanup
const int _kExceptionPrefixLength = 11;

// ==============================================================================
// SELLER ORDERS PAGE WIDGET
// ==============================================================================

/// Main dashboard for sellers to view and manage orders
///
/// This page is the heart of the seller app. It displays all orders
/// in a tab-based interface, allows status updates, and provides
/// quick access to map view and route planning.
///
/// Only accessible to authenticated sellers. Requires valid JWT token.
///
/// Features:
/// - Tab filtering (All, Confirmed, Delivered, Pending)
/// - Order status management
/// - Seller notes
/// - Map integration
/// - Route planning
/// - Pull-to-refresh
///
/// Usage:
/// ```dart
/// // After successful login
/// Navigator.pushReplacement(
///   context,
///   MaterialPageRoute(builder: (_) => SellerOrdersPage()),
/// );
/// ```
class SellerOrdersPage extends StatefulWidget {
  const SellerOrdersPage({super.key});

  @override
  State<SellerOrdersPage> createState() => _SellerOrdersPageState();
}

// ==============================================================================
// SELLER ORDERS PAGE STATE
// ==============================================================================

/// Private state class for SellerOrdersPage
///
/// Manages:
/// - Tab controller for filtering
/// - Order list and loading state
/// - Service instances (auth, orders)
/// - Filter state
class _SellerOrdersPageState extends State<SellerOrdersPage>
    with SingleTickerProviderStateMixin {
  // ---------------------------------------------------------------------------
  // STATE VARIABLES
  // ---------------------------------------------------------------------------

  /// Authentication service singleton
  final AuthService _authService = AuthService();

  /// Order service singleton
  final OrderService _orderService = OrderService();

  /// List of orders for current filter
  List<Order> _orders = [];

  /// Loading state flag
  bool _isLoading = true;

  /// Error message (null if no error)
  String? _error;

  /// Current filter status
  ///
  /// Values: 'all', 'confirmed', 'delivered', 'pending'
  String _filterStatus = 'all';

  /// Tab controller for managing tabs
  ///
  /// Controls which tab is active and syncs with filter state
  late TabController _tabController;

  // ---------------------------------------------------------------------------
  // LIFECYCLE METHODS
  // ---------------------------------------------------------------------------

  /// Initialize state, tab controller, and load orders
  ///
  /// Sets up tab controller with 4 tabs and listener for tab changes.
  /// The listener updates filter state when user switches tabs.
  @override
  void initState() {
    super.initState();

    // Initialize tab controller
    _tabController = TabController(length: _kTabCount, vsync: this);

    // Listen for tab changes and update filter
    _tabController.addListener(() {
      // Only react to tab changes, not intermediate states
      if (!_tabController.indexIsChanging) {
        setState(() {
          // Map tab index to filter status
          switch (_tabController.index) {
            case _kAllTabIndex:
              _filterStatus = 'all';
              break;
            case _kConfirmedTabIndex:
              _filterStatus = 'confirmed';
              break;
            case _kDeliveredTabIndex:
              _filterStatus = 'delivered';
              break;
            case _kPendingTabIndex:
              _filterStatus = 'pending';
              break;
          }
        });
        // Reload orders with new filter
        _loadOrders();
      }
    });

    // Load initial orders
    _loadOrders();
  }

  /// Dispose tab controller to prevent memory leaks
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  /// Load orders from backend with current filter
  ///
  /// Fetches orders via OrderService and updates state.
  /// Shows loading state while fetching.
  /// Handles errors gracefully.
  ///
  /// Filter logic:
  /// - 'all': All orders for seller
  /// - 'confirmed'/'delivered'/'pending': Orders with that status
  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch orders with optional status filter
      final orders = _filterStatus == 'all'
          ? await _orderService.getSellerOrders()
          : await _orderService.getSellerOrders(status: _filterStatus);

      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // STATUS CHANGE DIALOG
  // ---------------------------------------------------------------------------

  /// Show dialog for changing order status
  ///
  /// Delegates to StatusChangeDialog widget for UI,
  /// then calls OrderService to persist the change.
  ///
  /// Parameters:
  /// - [order]: Order to update
  Future<void> _showStatusChangeDialog(Order order) async {
    // Delegate to reusable widget
    final result = await StatusChangeDialog.show(
      context: context,
      order: order,
    );

    if (result == null) return; // User cancelled

    // Update order status via API
    try {
      await _orderService.updateOrderStatus(
        order.id,
        result.newStatus,
        notes: result.notes,
      );

      if (mounted) {
        // Show success feedback using helper
        final successMessage = StatusChangeDialog.buildSuccessMessage(
          result.newStatus,
          order.book.title,
        );
        ErrorUtils.showSuccessSnackBar(context, successMessage);

        // Reload orders to reflect status change
        _loadOrders();
      }
    } catch (e) {
      if (mounted) {
        // Show error feedback using utility
        final errorMsg = ErrorUtils.getErrorMessage(e);
        ErrorUtils.showErrorSnackBar(context, errorMsg);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ORDER DETAILS DIALOG
  // ---------------------------------------------------------------------------

  /// Show detailed information dialog for an order
  ///
  /// Displays:
  /// - Book information (title, author)
  /// - Customer information (name, phone)
  /// - Order details (quantity, price, status)
  /// - Delivery location (if available)
  /// - Buyer notes (if any)
  /// - Seller notes (if any)
  ///
  /// Provides button to change status (if order not finalized).
  ///
  /// Parameters:
  /// - [order]: Order to display
  Future<void> _showOrderDetails(Order order) async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              OrderStatusHelper.getIcon(order.status),
              color: OrderStatusHelper.getColor(order.status),
            ),
            const SizedBox(width: _kSmallSpacing),
            const Text('Détails de la commande'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Book and customer info
              _buildDetailRow('Livre', order.book.title, Icons.book),
              _buildDetailRow('Auteur', order.book.author, Icons.person),
              _buildDetailRow('Client', order.buyerName, Icons.account_circle),
              _buildDetailRow('Téléphone', order.buyer.phone ?? 'N/A', Icons.phone),
              _buildDetailRow('Quantité', order.quantity.toString(), Icons.numbers),
              _buildDetailRow(
                'Prix total',
                '${order.totalPrice.toStringAsFixed(2)} MAD',
                Icons.attach_money,
              ),
              _buildDetailRow('Statut', order.statusDisplay, Icons.info),

              // Location info (if available)
              if (order.buyerLocation != null) ...[
                const Divider(),
                _buildDetailRow(
                  'Adresse',
                  order.buyerLocation!.address ?? 'N/A',
                  Icons.location_on,
                ),
                _buildDetailRow(
                  'Coordonnées',
                  '${order.buyerLocation!.latitude.toStringAsFixed(6)}, '
                  '${order.buyerLocation!.longitude.toStringAsFixed(6)}',
                  Icons.map,
                ),
              ],

              // Buyer notes
              if (order.buyerNotes != null) ...[
                const Divider(),
                const Text(
                  'Notes du client:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: _kTinySpacing),
                Text(order.buyerNotes!),
              ],

              // Seller notes
              if (order.sellerNotes != null) ...[
                const Divider(),
                const Text(
                  'Mes notes:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: _kTinySpacing),
                Text(
                  order.sellerNotes!,
                  style: const TextStyle(fontStyle: FontStyle.italic),
                ),
              ],
            ],
          ),
        ),
        actions: [
          // Change status button (if order not finalized)
          if (order.status != 'delivered' && order.status != 'refused')
            TextButton.icon(
              onPressed: () {
                Navigator.pop(context);
                _showStatusChangeDialog(order);
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

  // ---------------------------------------------------------------------------
  // HELPER WIDGETS
  // ---------------------------------------------------------------------------

  /// Build a detail row with icon, label, and value
  ///
  /// Creates consistent layout for order details:
  /// [Icon] Label
  ///        Value
  ///
  /// Parameters:
  /// - [label]: Label text
  /// - [value]: Value text
  /// - [icon]: Icon to display
  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: _kDetailRowPadding),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: _kDetailRowIconSize, color: Colors.grey[600]),
          const SizedBox(width: _kSmallSpacing),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------

  /// Show logout confirmation dialog
  ///
  /// Confirms user wants to logout, then:
  /// 1. Calls AuthService.logout() to clear token
  /// 2. Navigates to LoginPage
  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Se déconnecter'),
        content: const Text('Voulez-vous vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Déconnexion',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _authService.logout();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginPage()),
        );
      }
    }
  }

  // All status helper methods removed - now using OrderStatusHelper!

  // ---------------------------------------------------------------------------
  // FLOATING ACTION BUTTONS
  // ---------------------------------------------------------------------------

  /// Build floating action buttons for map and route planning
  ///
  /// Shows two FABs when there are confirmed orders:
  /// 1. Route planning button (purple) - Opens tour selection page
  /// 2. Map view button (blue) - Opens order map page
  ///
  /// Returns null if no confirmed orders available.
  ///
  /// Parameters:
  /// - [confirmedOrders]: List of confirmed orders
  ///
  /// Returns:
  /// Column with two FABs, or null if no confirmed orders
  Widget? _buildFloatingActionButtons(List<Order> confirmedOrders) {
    if (confirmedOrders.isEmpty) return null;

    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Route planning FAB
        FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => OrderTourSelectionPage(
                  confirmedOrders: confirmedOrders,
                ),
              ),
            );
          },
          heroTag: 'tour',
          backgroundColor: Colors.deepPurple,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.route, color: Colors.white),
          label: const Text(
            'Planifier Tournée',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: _kFabSpacing),

        // Map view FAB
        FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => OrderMapPage(orders: confirmedOrders),
              ),
            );
          },
          heroTag: 'map',
          backgroundColor: Colors.blue[700],
          foregroundColor: Colors.white,
          icon: const Icon(Icons.map, color: Colors.white),
          label: Text(
            'Carte (${confirmedOrders.length})',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // BUILD METHOD
  // ---------------------------------------------------------------------------

  /// Build the seller orders page UI
  ///
  /// Layout structure:
  /// - AppBar with user info and actions
  /// - TabBar for filtering
  /// - Body with states: loading, error, empty, or order list
  /// - Floating action buttons for map and route planning
  ///
  /// The page uses RefreshIndicator for pull-to-refresh and
  /// ListView.builder for efficient rendering of potentially
  /// large order lists.
  @override
  Widget build(BuildContext context) {
    final user = _authService.currentUser;
    final confirmedOrders = _orders.where((o) => o.isConfirmed).toList();

    return Scaffold(
      // ========================================================================
      // APP BAR
      // ========================================================================
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Mes Livraisons'),
            if (user != null)
              Text(
                user.displayName,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.normal,
                ),
              ),
          ],
        ),
        actions: [
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualiser',
            onPressed: _loadOrders,
          ),
          // Logout button
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: _logout,
          ),
        ],
        // Tab bar for filtering
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Toutes', icon: Icon(Icons.list)),
            Tab(text: 'À livrer', icon: Icon(Icons.local_shipping)),
            Tab(text: 'Livrées', icon: Icon(Icons.check_circle)),
            Tab(text: 'En attente', icon: Icon(Icons.schedule)),
          ],
        ),
      ),

      // ========================================================================
      // BODY
      // ========================================================================
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: _isLoading
            // Loading state
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                // Error state
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: _kErrorIconSize,
                          color: Colors.red,
                        ),
                        const SizedBox(height: _kMajorSpacing),
                        Text('Erreur: $_error'),
                        const SizedBox(height: _kMajorSpacing),
                        ElevatedButton(
                          onPressed: _loadOrders,
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  )
                : _orders.isEmpty
                    // Empty state
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inbox,
                              size: _kEmptyIconSize,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: _kMajorSpacing),
                            const Text(
                              'Aucune commande',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: _kSmallSpacing),
                            Text(
                              'Aucune commande ${OrderStatusHelper.getFilterEmptyText(_filterStatus)}',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      )
                    // Order list
                    : ListView.builder(
                        padding: const EdgeInsets.all(_kListPadding),
                        itemCount: _orders.length,
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(
                              vertical: _kCardMargin,
                            ),
                            child: ListTile(
                              // Status indicator avatar
                              leading: CircleAvatar(
                                backgroundColor: OrderStatusHelper.getColor(order.status),
                                child: Icon(
                                  OrderStatusHelper.getIcon(order.status),
                                  color: Colors.white,
                                ),
                              ),

                              // Order title (book title)
                              title: Text(
                                order.book.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              // Order details
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Client: ${order.buyerName}'),
                                  Text(
                                    'Quantité: ${order.quantity} • '
                                    '${order.totalPrice.toStringAsFixed(2)} MAD',
                                  ),
                                  if (order.buyerLocation?.address != null)
                                    Text('📍 ${order.buyerLocation!.address}'),
                                ],
                              ),

                              // Status change button (if not finalized)
                              trailing: (order.status == 'delivered' ||
                                      order.status == 'refused')
                                  ? null // No button for final statuses
                                  : IconButton(
                                      icon: Icon(
                                        Icons.swap_horiz,
                                        color: OrderStatusHelper.getColor(order.status),
                                      ),
                                      tooltip: 'Changer statut',
                                      onPressed: () =>
                                          _showStatusChangeDialog(order),
                                    ),

                              // Tap to view details
                              onTap: () => _showOrderDetails(order),
                              isThreeLine: true,
                            ),
                          );
                        },
                      ),
      ),

      // ========================================================================
      // FLOATING ACTION BUTTONS
      // ========================================================================
      floatingActionButton: _buildFloatingActionButtons(confirmedOrders),
    );
  }
}
