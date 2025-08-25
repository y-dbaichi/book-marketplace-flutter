import { useEffect, useState } from 'react';
import { orderService } from '../../services/api';
import Button from '../../components/common/Button';
import { Container, Table, Badge, Modal } from 'react-bootstrap';

export default function BuyerOrders() {
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await orderService.getBuyerOrders();
        setOrders(response.orders || []);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const handleApprove = async (orderId) => {
    setUpdating(true);
    setError('');
    try {
      await orderService.updateOrderStatus(orderId, { status: 'confirmed' });
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status: 'confirmed' } : o));
      setShowModal(false);
    } catch (err) {
      setError('Failed to update order status.');
    }
    setUpdating(false);
  };

  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-cart-check me-2"></i>
        Order Management
      </h1>
      <p className="text-muted">Manage customer orders and confirmations.</p>
      {loading ? (
        <div className="text-center py-5">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">No orders found.</div>
      ) : (
        <Table hover responsive className="align-middle">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Book</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Location</th>
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
                <td><Badge bg={order.status === 'completed' ? 'success' : order.status === 'confirmed' ? 'primary' : 'warning'}>{order.status}</Badge></td>
                <td>{order.customer?.location?.address || 'N/A'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  {order.status === 'pending' && (
                    <Button size="sm" variant="success" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>Approve</Button>
                  )}
                  <Button size="sm" variant="outline" className="ms-2" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <div><strong>Order #:</strong> {selectedOrder._id.slice(-6)}</div>
              <div><strong>Book:</strong> {selectedOrder.book?.title}</div>
              <div><strong>Customer:</strong> {selectedOrder.customer?.profile?.firstName} {selectedOrder.customer?.profile?.lastName}</div>
              <div><strong>Status:</strong> {selectedOrder.status}</div>
              <div><strong>Location:</strong> {selectedOrder.customer?.location?.address || 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </>
          )}
          {error && <div className="alert alert-danger mt-2">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          {selectedOrder && selectedOrder.status === 'pending' && (
            <Button variant="success" loading={updating} onClick={() => handleApprove(selectedOrder._id)}>
              Approve Order
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
