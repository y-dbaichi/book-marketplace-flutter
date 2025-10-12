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
        const response = await orderService.getSellerOrders();
        setOrders(response.orders || []);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    setError('');
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      setShowModal(false);
    } catch (err) {
      setError('Failed to update order status.');
    }
    setUpdating(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      delivered: 'success',
      refused: 'danger'
    };
    return variants[status] || 'secondary';
  };

  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-cart-check me-2"></i>
        Order Management
      </h1>
      <p className="text-muted">Manage customer orders and delivery confirmations.</p>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No orders found.
        </div>
      ) : (
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Order #</th>
              <th>Book</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Status</th>
              <th>Delivery Location</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td><code>{order._id.slice(-6)}</code></td>
                <td>
                  <strong>{order.book?.title || 'N/A'}</strong>
                  <br />
                  <small className="text-muted">{order.book?.author}</small>
                </td>
                <td>
                  <div>
                    {order.buyer?.profile?.firstName && order.buyer?.profile?.lastName
                      ? `${order.buyer.profile.firstName} ${order.buyer.profile.lastName}`
                      : order.buyer?.email || 'N/A'}
                  </div>
                  <small className="text-muted">{order.buyer?.phone || 'N/A'}</small>
                </td>
                <td>{order.quantity}</td>
                <td><strong>{order.totalPrice} MAD</strong></td>
                <td>
                  <Badge bg={getStatusBadge(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {order.buyerLocation?.name || order.buyerLocation?.address || 'N/A'}
                  </div>
                  {order.buyerLocation?.address && order.buyerLocation?.name && (
                    <small className="text-muted d-block">
                      {order.buyerLocation.address}
                    </small>
                  )}
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="d-flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="success" 
                          onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleUpdateStatus(order._id, 'refused')}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Refuse
                        </Button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="info" 
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                      >
                        <i className="bi bi-truck me-1"></i>
                        Mark Delivered
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                    >
                      <i className="bi bi-eye"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>
            Order Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-muted mb-3">Order Information</h6>
                <div className="mb-2">
                  <strong>Order ID:</strong> <code>{selectedOrder._id}</code>
                </div>
                <div className="mb-2">
                  <strong>Status:</strong>{' '}
                  <Badge bg={getStatusBadge(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div className="mb-2">
                  <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
                <div className="mb-2">
                  <strong>Quantity:</strong> {selectedOrder.quantity}
                </div>
                <div className="mb-2">
                  <strong>Total Price:</strong> <strong className="text-success">{selectedOrder.totalPrice} MAD</strong>
                </div>
                
                <h6 className="text-muted mt-4 mb-3">Book Details</h6>
                <div className="mb-2">
                  <strong>Title:</strong> {selectedOrder.book?.title || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>Author:</strong> {selectedOrder.book?.author || 'N/A'}
                </div>
              </div>
              
              <div className="col-md-6">
                <h6 className="text-muted mb-3">Customer Information</h6>
                <div className="mb-2">
                  <strong>Name:</strong>{' '}
                  {selectedOrder.buyer?.profile?.firstName && selectedOrder.buyer?.profile?.lastName
                    ? `${selectedOrder.buyer.profile.firstName} ${selectedOrder.buyer.profile.lastName}`
                    : 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>Email:</strong> {selectedOrder.buyer?.email || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>Phone:</strong> {selectedOrder.buyer?.phone || 'N/A'}
                </div>

                <h6 className="text-muted mt-4 mb-3">Delivery Location</h6>
                <div className="mb-2">
                  <strong>Name:</strong> {selectedOrder.buyerLocation?.name || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>Address:</strong> {selectedOrder.buyerLocation?.address || 'N/A'}
                </div>
                {selectedOrder.buyerLocation?.coordinates && (
                  <div className="mb-2">
                    <strong>Coordinates:</strong>{' '}
                    <small className="text-muted">
                      {selectedOrder.buyerLocation.coordinates[1]}, {selectedOrder.buyerLocation.coordinates[0]}
                    </small>
                  </div>
                )}
                
                {selectedOrder.buyerNotes && (
                  <>
                    <h6 className="text-muted mt-4 mb-3">Customer Notes</h6>
                    <div className="alert alert-light">
                      {selectedOrder.buyerNotes}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          {selectedOrder && selectedOrder.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                loading={updating} 
                onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
              >
                <i className="bi bi-check-circle me-2"></i>
                Confirm Order
              </Button>
              <Button 
                variant="danger" 
                loading={updating} 
                onClick={() => handleUpdateStatus(selectedOrder._id, 'refused')}
              >
                <i className="bi bi-x-circle me-2"></i>
                Refuse Order
              </Button>
            </>
          )}
          {selectedOrder && selectedOrder.status === 'confirmed' && (
            <Button 
              variant="info" 
              loading={updating} 
              onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
            >
              <i className="bi bi-truck me-2"></i>
              Mark as Delivered
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
