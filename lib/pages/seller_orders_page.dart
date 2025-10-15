import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/order_service.dart';
import '../models/order.dart';
import 'login_page.dart';
import 'order_map_page.dart';
import 'order_tour_selection_page.dart';

class SellerOrdersPage extends StatefulWidget {
  const SellerOrdersPage({super.key});

  @override
  State<SellerOrdersPage> createState() => _SellerOrdersPageState();
}

class _SellerOrdersPageState extends State<SellerOrdersPage> with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  final OrderService _orderService = OrderService();

  List<Order> _orders = [];
  bool _isLoading = true;
  String? _error;
  String _filterStatus = 'all'; // all, confirmed, delivered, pending

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          switch (_tabController.index) {
            case 0:
              _filterStatus = 'all';
              break;
            case 1:
              _filterStatus = 'confirmed';
              break;
            case 2:
              _filterStatus = 'delivered';
              break;
            case 3:
              _filterStatus = 'pending';
              break;
          }
        });
        _loadOrders();
      }
    });
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
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

  Future<void> _markAsDelivered(Order order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Marquer comme livrée'),
        content: Text('Confirmer la livraison pour ${order.buyerName} ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _orderService.markAsDelivered(order.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Commande marquée comme livrée'),
            backgroundColor: Colors.green,
          ),
        );
        _loadOrders();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showOrderDetails(Order order) async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(_getStatusIcon(order.status), color: _getStatusColor(order.status)),
            const SizedBox(width: 8),
            const Text('Détails de la commande'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
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
              if (order.buyerLocation != null) ...[
                const Divider(),
                _buildDetailRow('Adresse', order.buyerLocation!.address ?? 'N/A', Icons.location_on),
                _buildDetailRow(
                  'Coordonnées',
                  '${order.buyerLocation!.latitude.toStringAsFixed(6)}, ${order.buyerLocation!.longitude.toStringAsFixed(6)}',
                  Icons.map,
                ),
              ],
              if (order.buyerNotes != null) ...[
                const Divider(),
                const Text('Notes du client:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(order.buyerNotes!),
              ],
            ],
          ),
        ),
        actions: [
          if (order.isConfirmed)
            TextButton.icon(
              onPressed: () {
                Navigator.pop(context);
                _markAsDelivered(order);
              },
              icon: const Icon(Icons.check_circle),
              label: const Text('Marquer livrée'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

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
            child: const Text('Déconnexion', style: TextStyle(color: Colors.red)),
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'refused':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.schedule;
      case 'confirmed':
        return Icons.check_circle_outline;
      case 'delivered':
        return Icons.check_circle;
      case 'refused':
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _authService.currentUser;
    final confirmedOrders = _orders.where((o) => o.isConfirmed).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Mes Livraisons'),
            if (user != null)
              Text(
                user.displayName,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualiser',
            onPressed: _loadOrders,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Déconnexion',
            onPressed: _logout,
          ),
        ],
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
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Erreur: $_error'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadOrders,
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  )
                : _orders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            const Text(
                              'Aucune commande',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Aucune commande ${_getFilterText()}',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: _orders.length,
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: _getStatusColor(order.status),
                                child: Icon(_getStatusIcon(order.status), color: Colors.white),
                              ),
                              title: Text(
                                order.book.title,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Client: ${order.buyerName}'),
                                  Text('Quantité: ${order.quantity} • ${order.totalPrice.toStringAsFixed(2)} MAD'),
                                  if (order.buyerLocation?.address != null)
                                    Text('📍 ${order.buyerLocation!.address}'),
                                ],
                              ),
                              trailing: order.isConfirmed
                                  ? IconButton(
                                      icon: const Icon(Icons.check_circle, color: Colors.green),
                                      tooltip: 'Marquer livrée',
                                      onPressed: () => _markAsDelivered(order),
                                    )
                                  : Chip(
                                      label: Text(order.statusDisplay),
                                      backgroundColor: _getStatusColor(order.status).withOpacity(0.2),
                                    ),
                              onTap: () => _showOrderDetails(order),
                              isThreeLine: true,
                            ),
                          );
                        },
                      ),
      ),
      floatingActionButton: confirmedOrders.isNotEmpty
          ? Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (confirmedOrders.length >= 2)
                  FloatingActionButton.extended(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderTourSelectionPage(confirmedOrders: confirmedOrders),
                        ),
                      );
                    },
                    heroTag: 'tour',
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    icon: const Icon(Icons.route, color: Colors.white),
                    label: const Text('Planifier Tournée', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                const SizedBox(height: 12),
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
                  label: Text('Carte (${confirmedOrders.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            )
          : null,
    );
  }

  String _getFilterText() {
    switch (_filterStatus) {
      case 'confirmed':
        return 'à livrer';
      case 'delivered':
        return 'livrée';
      case 'pending':
        return 'en attente';
      default:
        return 'trouvée';
    }
  }
}
