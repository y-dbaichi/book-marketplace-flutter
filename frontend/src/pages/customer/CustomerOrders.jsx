import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Tab, Tabs, ProgressBar } from 'react-bootstrap';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import LocationMap from '../../components/common/LocationMap';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getCustomerOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      in_transit: 'primary',
      completed: 'success'
    };
    return variants[status] || 'secondary';
  };

  const getStatusProgress = (status) => {
    const progress = {
      pending: 25,
      confirmed: 50,
      in_transit: 75,
      completed: 100
    };
    return progress[status] || 0;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Order Placed',
      confirmed: 'Confirmed by Seller',
      in_transit: 'Ready for Pickup',
      completed: 'Completed'
    };
    return texts[status] || status;
  };

  // Create map points from orders for location view
  const orderLocations = orders
    .filter(order => order.book?.buyer?.location)
    .map(order => ({
      id: order._id,
      name: order.book.buyer.location.name,
      email: order.book.buyer.email,
      phone: order.book.buyer.phone,
      address: order.book.buyer.location.address,
      latitude: order.book.buyer.location.coordinates.latitude,
      longitude: order.book.buyer.location.coordinates.longitude,
      status: order.status,
      bookTitle: order.book.title,
      totalPrice: order.totalPrice,
      orderDate: order.createdAt
    }));

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <i className="bi bi-bag-check me-2"></i>
            My Orders
          </h1>
          <p className="text-muted mb-0">Track your book orders and pickup locations</p>
        </div>
        <Badge bg="primary" className="fs-6">{orders.length} orders</Badge>
      </div>

      <Tabs defaultActiveKey="list" className="mb-4">
        <Tab eventKey="list" title={
          <span>
            <i className="bi bi-list me-2"></i>
            Order List
          </span>
        }>
          {orders.length === 0 ? (
            <Card className="text-center p-5">
              <i className="bi bi-bag fs-1 text-muted mb-3"></i>
              <h3 className="text-muted mb-3">No orders yet</h3>
              <p className="text-muted mb-4">Start browsing books to place your first order</p>
              <Button variant="primary" onClick={() => window.location.href = '/marketplace'}>
                <i className="bi bi-shop me-2"></i>
                Browse Books
              </Button>
            </Card>
          ) : (
            <Row>
              {orders.map((order) => (
                <Col lg={6} key={order._id} className="mb-4">
                  <Card className="order-card h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="mb-1">{order.book?.title}</h6>
                          <small className="text-muted">by {order.book?.author}</small>
                        </div>
                        <Badge bg={getStatusBadge(order.status)} className="text-capitalize">
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="order-progress mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">Order Progress</small>
                          <small className="text-muted">{getStatusProgress(order.status)}%</small>
                        </div>
                        <ProgressBar
                          now={getStatusProgress(order.status)}
                          variant={order.status === 'completed' ? 'success' : 'primary'}
                          className="mb-2"
                        />
                        <small className="text-muted">{getStatusText(order.status)}</small>
                      </div>

                      <div className="order-details mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Price:</span>
                          <strong className="text-success">{order.totalPrice}€</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Quantity:</span>
                          <span>{order.quantity}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Order Date:</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* Always show the pickup/delivery location for this order */}
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Pickup/Delivery Location:</span>
                          <span>{order.pickupLocation || order.book?.buyer?.location?.address || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="seller-info">
                        <h6 className="mb-2">
                          <i className="bi bi-shop me-2"></i>
                          Seller Information
                        </h6>
                        <div className="bg-light p-3 rounded">
                          <div className="mb-1">
                            <strong>{order.book?.buyer?.location?.name}</strong>
                          </div>
                          <div className="mb-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            <small>{order.book?.buyer?.location?.address}</small>
                          </div>
                          {order.book?.buyer?.phone && (
                            <div>
                              <i className="bi bi-telephone me-1"></i>
                              <small>{order.book?.buyer?.phone}</small>
                            </div>
                          )}
                        </div>
                      </div>

                      {order.customerNotes && (
                        <div className="mt-3">
                          <small className="text-muted">
                            <i className="bi bi-chat-left-text me-1"></i>
                            Note: {order.customerNotes}
                          </small>
                        </div>
                      )}

                      {/* Approve/Acknowledge button for buyer to confirm pickup/delivery */}
                      {['confirmed', 'in_transit'].includes(order.status) && (
                        <div className="d-flex justify-content-end mt-3">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={async () => {
                              try {
                                await orderService.updateOrderStatus(order._id, 'completed');
                                setOrders(orders => orders.map(o => o._id === order._id ? { ...o, status: 'completed' } : o));
                              } catch (err) {
                                alert('Failed to update order status.');
                              }
                            }}
                          >
                            {order.status === 'confirmed' ? 'Acknowledge Pickup' : 'Mark as Completed'}
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>

        <Tab eventKey="map" title={
          <span>
            <i className="bi bi-map me-2"></i>
            Pickup Locations
          </span>
        }>
          <Card>
            <Card.Body>
              <LocationMap
                points={orderLocations}
                type="suppliers"
                title="Pickup Locations"
                loading={loading}
              />
              {/* Show all orders as a list below the map for clarity */}
              {orderLocations.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3">Your Orders on the Map</h5>
                  <ul className="list-group">
                    {orderLocations.map(loc => (
                      <li key={loc.id} className="list-group-item d-flex flex-column align-items-start">
                        <div><strong>{loc.bookTitle}</strong> <span className="text-muted">({loc.status})</span></div>
                        <div><i className="bi bi-geo-alt me-1"></i> {loc.address}</div>
                        <div><i className="bi bi-calendar me-1"></i> {new Date(loc.orderDate).toLocaleDateString()}</div>
                        <div><i className="bi bi-cash me-1"></i> {loc.totalPrice}€</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}
