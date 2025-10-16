import { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { bookService, orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

export default function BuyerDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    lowStockBooks: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch books and orders in parallel
      const [booksResponse, ordersResponse] = await Promise.all([
        bookService.getMyListings(),
        orderService.getSellerOrders()
      ]);

      const books = booksResponse.books || [];
      const orders = ordersResponse.orders || [];

      // Calculate business metrics
      const completedOrders = orders.filter(order => order.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const lowStockBooks = books.filter(book => book.quantity <= 2).length;
      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Mock monthly growth (in real app, compare with previous month)
      const monthlyGrowth = Math.floor(Math.random() * 20) + 5; // 5-25% growth

      setStats({
        totalBooks: books.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        completedOrders: completedOrders.length,
        totalRevenue: totalRevenue,
        lowStockBooks: lowStockBooks,
        averageOrderValue: averageOrderValue,
        monthlyGrowth: monthlyGrowth
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      completed: 'bg-success'
    };
    return classes[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '1400px' }}>
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm bg-gradient-primary text-white overflow-hidden position-relative">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h1 className="mb-2 fw-bold">
                    Welcome back, {user?.profile?.firstName || 'Seller'}! 👋
                  </h1>
                  <p className="mb-0 opacity-90">
                    Here's what's happening with your book business today
                  </p>
                </Col>
                <Col md={4} className="text-md-end">
                  <Link to="/buyer/books">
                    <Button variant="light" size="lg" className="shadow-sm">
                      <i className="bi bi-plus-circle me-2"></i>
                      Add New Book
                    </Button>
                  </Link>
                </Col>
              </Row>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute',
                right: '-50px',
                top: '-50px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}></div>
              <div style={{
                position: 'absolute',
                right: '100px',
                bottom: '-80px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100 kpi-card-modern" style={{ transition: 'all 0.3s' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-currency-dollar fs-3 text-success"></i>
                </div>
                <div className="d-flex align-items-center text-success">
                  <i className="bi bi-arrow-up-short fs-5"></i>
                  <span className="small fw-semibold">+{stats.monthlyGrowth}%</span>
                </div>
              </div>
              <h6 className="text-muted text-uppercase small mb-2 fw-semibold">Total Revenue</h6>
              <h2 className="mb-0 fw-bold">{stats.totalRevenue.toFixed(2)} MAD</h2>
              <p className="small text-muted mb-0 mt-2">
                <i className="bi bi-calendar3 me-1"></i>
                This month
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100 kpi-card-modern" style={{ transition: 'all 0.3s' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-cart-check fs-3 text-primary"></i>
                </div>
                {stats.pendingOrders > 0 && (
                  <span className="badge bg-warning text-dark">
                    {stats.pendingOrders} pending
                  </span>
                )}
              </div>
              <h6 className="text-muted text-uppercase small mb-2 fw-semibold">Total Orders</h6>
              <h2 className="mb-0 fw-bold">{stats.totalOrders}</h2>
              <p className="small text-muted mb-0 mt-2">
                <i className="bi bi-check-circle me-1"></i>
                {stats.completedOrders} completed
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100 kpi-card-modern" style={{ transition: 'all 0.3s' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-book fs-3 text-info"></i>
                </div>
                {stats.lowStockBooks > 0 && (
                  <span className="badge bg-danger">
                    {stats.lowStockBooks} low
                  </span>
                )}
              </div>
              <h6 className="text-muted text-uppercase small mb-2 fw-semibold">Books Listed</h6>
              <h2 className="mb-0 fw-bold">{stats.totalBooks}</h2>
              <p className="small text-muted mb-0 mt-2">
                <i className="bi bi-box-seam me-1"></i>
                In your inventory
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100 kpi-card-modern" style={{ transition: 'all 0.3s' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                  <i className="bi bi-graph-up-arrow fs-3 text-warning"></i>
                </div>
              </div>
              <h6 className="text-muted text-uppercase small mb-2 fw-semibold">Avg Order Value</h6>
              <h2 className="mb-0 fw-bold">{stats.averageOrderValue.toFixed(2)} MAD</h2>
              <p className="small text-muted mb-0 mt-2">
                <i className="bi bi-calculator me-1"></i>
                Per transaction
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders & Quick Actions */}
      <Row className="g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Recent Orders
              </h5>
              <Link to="/buyer/orders" className="btn btn-sm btn-outline-primary">
                View All
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No orders yet</h5>
                  <p className="text-muted">Orders will appear here once customers place them</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentOrders.map((order, index) => (
                    <div key={order._id} className="list-group-item border-0 px-4 py-3 recent-order-item" style={{ transition: 'all 0.2s' }}>
                      <Row className="align-items-center">
                        <Col xs="auto">
                          <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                            <i className="bi bi-book fs-5 text-primary"></i>
                          </div>
                        </Col>
                        <Col>
                          <h6 className="mb-1 fw-semibold">{order.book?.title}</h6>
                          <p className="mb-0 text-muted small">
                            <i className="bi bi-person-circle me-1"></i>
                            {order.buyer?.profile?.firstName && order.buyer?.profile?.lastName
                              ? `${order.buyer.profile.firstName} ${order.buyer.profile.lastName}`
                              : order.buyer?.email || 'N/A'}
                          </p>
                        </Col>
                        <Col xs="auto" className="text-end">
                          <span className={`badge ${getStatusBadgeClass(order.status)} mb-2 text-capitalize px-3 py-2`}>
                            {order.status}
                          </span>
                          <div className="fw-bold text-success">{order.totalPrice} MAD</div>
                          <small className="text-muted">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </small>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-lightning-charge-fill me-2 text-warning"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-grid gap-2">
                <Link to="/buyer/books" className="text-decoration-none">
                  <Card className="border-0 bg-primary bg-opacity-10 quick-action-card" style={{ transition: 'all 0.2s' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle p-2 me-3">
                          <i className="bi bi-plus-circle fs-5 text-white"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">Add New Book</div>
                          <small className="text-muted">Expand your inventory</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>

                <Link to="/buyer/orders" className="text-decoration-none">
                  <Card className="border-0 bg-info bg-opacity-10 quick-action-card" style={{ transition: 'all 0.2s' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-info rounded-circle p-2 me-3">
                          <i className="bi bi-cart-check fs-5 text-white"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">Manage Orders</div>
                          <small className="text-muted">Process customer orders</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>

                <Link to="/buyer/clients" className="text-decoration-none">
                  <Card className="border-0 bg-success bg-opacity-10 quick-action-card" style={{ transition: 'all 0.2s' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-success rounded-circle p-2 me-3">
                          <i className="bi bi-people fs-5 text-white"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">View Clients</div>
                          <small className="text-muted">Check customer data</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>

                <Link to="/profile" className="text-decoration-none">
                  <Card className="border-0 bg-warning bg-opacity-10 quick-action-card" style={{ transition: 'all 0.2s' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-warning rounded-circle p-2 me-3">
                          <i className="bi bi-gear fs-5 text-white"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">Settings</div>
                          <small className="text-muted">Update your profile</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CSS Animations */}
      <style>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .kpi-card-modern:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.15) !important;
        }

        .recent-order-item:hover {
          background-color: #f8f9fa;
        }

        .quick-action-card:hover {
          transform: translateX(5px);
          box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1) !important;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .kpi-card-modern {
          animation: fadeInUp 0.4s ease-out;
        }

        .kpi-card-modern:nth-child(1) { animation-delay: 0.1s; }
        .kpi-card-modern:nth-child(2) { animation-delay: 0.2s; }
        .kpi-card-modern:nth-child(3) { animation-delay: 0.3s; }
        .kpi-card-modern:nth-child(4) { animation-delay: 0.4s; }
      `}</style>
    </Container>
  );
}
