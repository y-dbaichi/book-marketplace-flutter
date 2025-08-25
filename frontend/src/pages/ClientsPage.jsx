import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        // Use the seller-specific clients endpoint for sellers
        const res = await axios.get('/api/buyer/clients');
        setClients(res.data.clients || []);
      } catch (err) {
        setClients([]);
      }
      setLoading(false);
    }
    fetchClients();
  }, []);

  const handleMeet = async (orderId) => {
    setMeeting(orderId);
    setError('');
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: 'in_progress' });
      setClients(clients => clients.map(c => ({
        ...c,
        orders: c.orders.map(o => o._id === orderId ? { ...o, status: 'in_progress' } : o)
      })));
    } catch (err) {
      setError('Failed to update order status.');
    }
    setMeeting(null);
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">My Clients</h2>
      {loading ? (
        <div className="text-center py-5">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="alert alert-info">No clients found.</div>
      ) : (
        <div className="row g-4">
          {clients.map(client => (
            <div className="col-md-4 col-lg-3" key={client._id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{client.profile?.firstName} {client.profile?.lastName}</h5>
                  <p className="card-text text-muted">{client.email}</p>
                  <p className="card-text">Location: {client.location?.address}</p>
                  {client.orders && client.orders.map(order => (
                    <div key={order._id} className="mb-2">
                      <div><strong>Order:</strong> {order.book?.title}</div>
                      <div><strong>Status:</strong> {order.status}</div>
                      <div><strong>Pickup Location:</strong> {order.pickupLocation || client.location?.address || 'N/A'}</div>
                      {order.status === 'confirmed' && order.orderType === 'pickup' && (
                        <Button size="sm" variant="primary" loading={meeting === order._id} onClick={() => handleMeet(order._id)}>
                          Meet
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
}
