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
        orderService.getBuyerOrders()
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <i className="bi bi-speedometer2 me-2"></i>
            Seller Dashboard
          </h1>
          <p className="text-muted mb-0">
            Welcome back, {user?.profile?.firstName || 'Seller'}!
          </p>
        </div>
        <Link to="/buyer/books">
          <Button variant="primary">
            <i className="bi bi-plus-circle me-2"></i>
            Add New Book
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <Row className="mb-5">
        <Col lg={3} md={6} className="mb-4">
          <div className="kpi-card kpi-card-revenue">
            <div className="kpi-content">
              <div className="kpi-icon">
                <i className="bi bi-currency-euro"></i>
              </div>
              <div className="kpi-details">
                <h3 className="kpi-value">{stats.totalRevenue.toFixed(2)}€</h3>
                <p className="kpi-label">Total Revenue</p>
                <div className="kpi-trend">
                  <i className="bi bi-arrow-up"></i>
                  <span>+{stats.monthlyGrowth}% this month</span>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-4">
          <div className="kpi-card kpi-card-orders">
            <div className="kpi-content">
              <div className="kpi-icon">
                <i className="bi bi-cart-check"></i>
              </div>
              <div className="kpi-details">
                <h3 className="kpi-value">{stats.totalOrders}</h3>
                <p className="kpi-label">Total Orders</p>
                <div className="kpi-trend">
                  <i className="bi bi-clock"></i>
                  <span>{stats.pendingOrders} pending</span>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-4">
          <div className="kpi-card kpi-card-books">
            <div className="kpi-content">
              <div className="kpi-icon">
                <i className="bi bi-book"></i>
              </div>
              <div className="kpi-details">
                <h3 className="kpi-value">{stats.totalBooks}</h3>
                <p className="kpi-label">Books Listed</p>
                <div className="kpi-trend">
                  <i className="bi bi-exclamation-triangle"></i>
                  <span>{stats.lowStockBooks} low stock</span>
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-4">
          <div className="kpi-card kpi-card-avg">
            <div className="kpi-content">
              <div className="kpi-icon">
                <i className="bi bi-graph-up"></i>
              </div>
              <div className="kpi-details">
                <h3 className="kpi-value">{stats.averageOrderValue.toFixed(2)}€</h3>
                <p className="kpi-label">Avg Order Value</p>
                <div className="kpi-trend">
                  <i className="bi bi-check-circle"></i>
                  <span>{stats.completedOrders} completed</span>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Orders
              </h5>
              <Link to="/buyer/orders" className="text-decoration-none">
                View All
              </Link>
            </Card.Header>
            <Card.Body>
              {recentOrders.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No orders yet</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{order.book?.title}</h6>
                          <p className="mb-1 text-muted small">
                            Customer: {order.customer?.profile?.firstName} {order.customer?.profile?.lastName}
                          </p>
                          <small className="text-muted">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${getStatusBadgeClass(order.status)} mb-1`}>
                            {order.status}
                          </span>
                          <div className="fw-bold">{order.totalPrice}€</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/buyer/books">
                  <Button variant="outline" className="w-100 text-start">
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Book
                  </Button>
                </Link>
                <Link to="/buyer/orders">
                  <Button variant="outline" className="w-100 text-start">
                    <i className="bi bi-cart-check me-2"></i>
                    Manage Orders
                  </Button>
                </Link>
                <Link to="/buyer/exports">
                  <Button variant="outline" className="w-100 text-start">
                    <i className="bi bi-download me-2"></i>
                    GeoJSON Exports
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-100 text-start">
                    <i className="bi bi-gear me-2"></i>
                    Profile Settings
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
