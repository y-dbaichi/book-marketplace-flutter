import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await axios.get('/api/orders');
        setOrders(res.data);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Orders</h2>
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
