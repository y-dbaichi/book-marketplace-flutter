import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchOrders(true); // Show loading on initial load

    // Auto-refresh every 30 seconds to show order status updates
    const refreshInterval = setInterval(() => {
      fetchOrders(false); // Don't show loading spinner on auto-refresh
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function fetchOrders(showLoadingSpinner = true) {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }

  const handleManualRefresh = () => {
    fetchOrders(false);
    setLastRefresh(Date.now());
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Orders</h2>
          <small className="text-muted">
            <i className="bi bi-clock me-1"></i>
            Auto-refreshes every 30s • Last: {new Date(lastRefresh).toLocaleTimeString()}
          </small>
        </div>
        <Button variant="outline" onClick={handleManualRefresh}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-5">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">No orders found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Book</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{order._id.slice(-6)}</td>
                  <td>{order.book?.title}</td>
                  <td>{order.customer?.profile?.firstName} {order.customer?.profile?.lastName}</td>
                  <td><span className={`badge bg-${order.status === 'completed' ? 'success' : 'warning'}`}>{order.status}</span></td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td><Button size="sm" variant="primary">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
