import { useEffect, useState } from 'react';
import { orderService } from '../services/api';
import Button from '../components/common/Button';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Fetch customer orders and group by book.buyer (supplier)
      const response = await orderService.getCustomerOrders();
      const orders = response.orders || [];
      const suppliersMap = new Map();
      orders.forEach(order => {
        const buyer = order.book?.buyer;
        if (buyer && buyer._id) {
          if (!suppliersMap.has(buyer._id)) {
            suppliersMap.set(buyer._id, {
              ...buyer,
              orders: [order],
            });
          } else {
            suppliersMap.get(buyer._id).orders.push(order);
          }
        }
      });
      setSuppliers(Array.from(suppliersMap.values()));
    } catch (err) {
      setSuppliers([]);
    }
    setLoading(false);
  };

  const handleMeet = async (orderId) => {
    setMeeting(orderId);
    setError('');
    try {
      await orderService.updateOrderStatus(orderId, { status: 'in_progress' });
      setSuppliers(suppliers => suppliers.map(s => ({
        ...s,
        orders: s.orders.map(o => o._id === orderId ? { ...o, status: 'in_progress' } : o)
      })));
    } catch (err) {
      setError('Failed to update order status.');
    }
    setMeeting(null);
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">My Suppliers</h2>
      {loading ? (
        <div className="text-center py-5">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="alert alert-info">No suppliers found.</div>
      ) : (
        <div className="row g-4">
          {suppliers.map(supplier => (
            <div className="col-md-4 col-lg-3" key={supplier._id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{supplier.profile?.firstName} {supplier.profile?.lastName}</h5>
                  <p className="card-text text-muted">{supplier.email}</p>
                  <p className="card-text">Location: {supplier.location?.address}</p>
                  {supplier.orders && supplier.orders.map(order => (
                    <div key={order._id} className="mb-2">
                      <div><strong>Order:</strong> {order.book?.title}</div>
                      <div><strong>Status:</strong> {order.status}</div>
                      <div><strong>Pickup Location:</strong> {order.pickupLocation || supplier.location?.address || 'N/A'}</div>
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
