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
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [activeTab, setActiveTab] = useState('list');
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders(true); // Show loading on initial load

    // Auto-refresh every 30 seconds to show order status updates
    const refreshInterval = setInterval(() => {
      fetchOrders(false); // Don't show loading spinner on auto-refresh
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchOrders = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const response = await orderService.getBuyerOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  const handleManualRefresh = () => {
    fetchOrders(false);
    setLastRefresh(Date.now());
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      delivered: 'info',
      refused: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getStatusProgress = (status) => {
    const progress = {
      pending: 33,
      confirmed: 66,
      delivered: 100,
      refused: 0
    };
    return progress[status] || 0;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Waiting for Seller Confirmation',
      confirmed: 'Confirmed - Seller Will Deliver',
      delivered: 'Delivered Successfully',
      refused: 'Order Refused by Seller'
    };
    return texts[status] || status;
  };

  // Create map points from orders for location view (seller locations)
  const orderLocations = orders
    .filter(order => order.sellerLocation?.coordinates && order.sellerLocation.coordinates.length === 2)
    .map(order => ({
      id: order._id,
      name: order.seller?.profile?.firstName && order.seller?.profile?.lastName
        ? `${order.seller.profile.firstName} ${order.seller.profile.lastName}`
        : order.sellerLocation?.name || 'Seller',
      email: order.seller?.email || 'N/A',
      phone: order.seller?.phone || 'N/A',
      address: order.sellerLocation?.address || 'N/A',
      latitude: order.sellerLocation.coordinates[1], // GeoJSON format: [lng, lat]
      longitude: order.sellerLocation.coordinates[0],
      status: order.status,
      bookTitle: order.book?.title || 'N/A',
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
          <p className="text-muted mb-0">
            Track your book orders and delivery status
            <span className="ms-3 small">
              <i className="bi bi-clock me-1"></i>
              Auto-refreshes every 30s • Last: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Button variant="outline-secondary" onClick={handleManualRefresh}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <Badge bg="primary" className="fs-6">{orders.length} orders</Badge>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
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
                          variant={order.status === 'delivered' ? 'success' : order.status === 'refused' ? 'danger' : 'primary'}
                          className="mb-2"
                        />
                        <small className="text-muted">{getStatusText(order.status)}</small>
                      </div>

                      <div className="order-details mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Price:</span>
                          <strong className="text-success">{order.totalPrice} MAD</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Quantity:</span>
                          <span>{order.quantity}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Order Date:</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Delivery To:</span>
                          <span className="text-end" style={{ maxWidth: '60%' }}>
                            {order.buyerLocation?.address || order.location?.address || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="seller-info">
                        <h6 className="mb-2">
                          <i className="bi bi-shop me-2"></i>
                          Seller Information
                        </h6>
                        <div className="bg-light p-3 rounded">
                          <div className="mb-1">
                            <strong>
                              {order.seller?.profile?.firstName && order.seller?.profile?.lastName
                                ? `${order.seller.profile.firstName} ${order.seller.profile.lastName}`
                                : order.sellerLocation?.name || 'Book Seller'}
                            </strong>
                          </div>
                          <div className="mb-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            <small>{order.sellerLocation?.address || 'N/A'}</small>
                          </div>
                          {order.seller?.phone && (
                            <div>
                              <i className="bi bi-telephone me-1"></i>
                              <small>{order.seller?.phone}</small>
                            </div>
                          )}
                        </div>
                      </div>

                      {order.buyerNotes && (
                        <div className="mt-3">
                          <small className="text-muted">
                            <i className="bi bi-chat-left-text me-1"></i>
                            My Note: {order.buyerNotes}
                          </small>
                        </div>
                      )}

                      {order.sellerNotes && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small className="text-primary fw-semibold">
                            <i className="bi bi-shop me-1"></i>
                            Seller Note:
                          </small>
                          <small className="text-dark fst-italic d-block mt-1">
                            "{order.sellerNotes}"
                          </small>
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
            Seller Locations
          </span>
        }>
          <Card>
            <Card.Body>
              {activeTab === 'map' && (
                <LocationMap
                  key={orderLocations.length} // Force re-render when orders change
                  points={orderLocations}
                  type="suppliers"
                  title="Seller Locations"
                  loading={loading}
                />
              )}
              {orderLocations.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3">Your Orders</h5>
                  <ul className="list-group">
                    {orderLocations.map(loc => (
                      <li key={loc.id} className="list-group-item d-flex flex-column align-items-start">
                        <div className="d-flex justify-content-between w-100">
                          <strong>{loc.bookTitle}</strong>
                          <Badge bg={getStatusBadge(loc.status)}>{loc.status}</Badge>
                        </div>
                        <div className="text-muted mt-1">
                          <i className="bi bi-geo-alt me-1"></i>
                          Seller: {loc.address}
                        </div>
                        <div className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          {new Date(loc.orderDate).toLocaleDateString()}
                        </div>
                        <div className="text-success fw-bold">
                          <i className="bi bi-cash me-1"></i>
                          {loc.totalPrice} MAD
                        </div>
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
