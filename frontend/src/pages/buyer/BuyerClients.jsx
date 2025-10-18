import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LocationMap from '../../components/common/LocationMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BuyerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await orderService.getSellerOrders();
      const orders = response.orders || [];

      // Group orders by buyer (customer) to create client data
      const clientsMap = new Map();

      orders.forEach(order => {
        const buyer = order.buyer;
        const buyerLocation = order.buyerLocation;

        // Only include if we have buyer and location data
        if (buyer && buyerLocation && buyerLocation.coordinates && buyerLocation.coordinates.length === 2) {
          const clientId = buyer._id;

          if (clientsMap.has(clientId)) {
            const existingClient = clientsMap.get(clientId);
            existingClient.totalOrders += 1;
            existingClient.totalSpent += order.totalPrice || 0;
            existingClient.lastOrder = new Date(Math.max(
              new Date(existingClient.lastOrder),
              new Date(order.createdAt)
            ));
          } else {
            clientsMap.set(clientId, {
              id: clientId,
              name: `${buyer.profile?.firstName || ''} ${buyer.profile?.lastName || ''}`.trim() || buyer.email || 'Unknown',
              email: buyer.email || 'N/A',
              phone: buyer.phone || 'N/A',
              address: buyerLocation.address || 'N/A',
              latitude: buyerLocation.coordinates[1], // GeoJSON format: [lng, lat]
              longitude: buyerLocation.coordinates[0],
              totalOrders: 1,
              totalSpent: order.totalPrice || 0,
              lastOrder: new Date(order.createdAt),
              status: 'active'
            });
          }
        }
      });

      setClients(Array.from(clientsMap.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">
                <i className="bi bi-people-fill me-2 text-primary"></i>
                My Clients
              </h1>
              <p className="text-muted mb-0">View and manage your customer relationships</p>
            </div>
            <div className="text-end">
              <div className="fs-4 fw-bold text-primary">{clients.length}</div>
              <small className="text-muted">Total Clients</small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Row */}
      {clients.length > 0 && (
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-cart-check fs-4 text-primary"></i>
                </div>
                <div>
                  <div className="fs-5 fw-bold">{clients.reduce((sum, c) => sum + c.totalOrders, 0)}</div>
                  <small className="text-muted">Total Orders</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-currency-dollar fs-4 text-success"></i>
                </div>
                <div>
                  <div className="fs-5 fw-bold">{clients.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)} MAD</div>
                  <small className="text-muted">Total Revenue</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-calculator fs-4 text-info"></i>
                </div>
                <div>
                  <div className="fs-5 fw-bold">
                    {(clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length).toFixed(2)} MAD
                  </div>
                  <small className="text-muted">Avg per Client</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 modern-tabs"
      >
        <Tab eventKey="map" title={
          <span>
            <i className="bi bi-map me-2"></i>
            Map View
          </span>
        }>
          <Card>
            <Card.Body>
              {activeTab === 'map' && (
                <LocationMap
                  points={clients}
                  type="clients"
                  title="Client Locations"
                  loading={loading}
                />
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="list" title={
          <span>
            <i className="bi bi-grid-3x3-gap me-2"></i>
            Grid View
          </span>
        }>
          <Row className="g-3">
            {clients.length === 0 ? (
              <Col>
                <Card className="text-center py-5 border-0 shadow-sm">
                  <Card.Body>
                    <i className="bi bi-people display-1 text-muted mb-3"></i>
                    <h3 className="text-muted mb-3">No clients yet</h3>
                    <p className="text-muted">Start selling books to see your clients here</p>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              clients.map((client, index) => (
                <Col md={6} lg={4} key={client.id}>
                  <Card className="h-100 border-0 shadow-sm client-card-modern" style={{ transition: 'all 0.3s' }}>
                    <Card.Body className="p-4">
                      {/* Avatar & Name */}
                      <div className="text-center mb-4">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                          <i className="bi bi-person-circle display-4 text-primary"></i>
                        </div>
                        <h5 className="mb-1 fw-semibold">{client.name}</h5>
                        <p className="text-muted small mb-0">{client.email}</p>
                      </div>

                      {/* Stats Grid */}
                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <div className="bg-light rounded-3 p-3 text-center">
                            <div className="fw-bold text-primary fs-4">{client.totalOrders}</div>
                            <small className="text-muted">Orders</small>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="bg-light rounded-3 p-3 text-center">
                            <div className="fw-bold text-success fs-5">{client.totalSpent.toFixed(0)} MAD</div>
                            <small className="text-muted">Total Spent</small>
                          </div>
                        </Col>
                      </Row>

                      {/* Details */}
                      <div className="border-top pt-3">
                        <div className="d-flex align-items-start mb-2">
                          <i className="bi bi-calendar3 text-muted me-2 mt-1"></i>
                          <div className="flex-grow-1">
                            <small className="text-muted d-block">Last Order</small>
                            <small className="fw-semibold">{client.lastOrder.toLocaleDateString()}</small>
                          </div>
                        </div>

                        <div className="d-flex align-items-start mb-2">
                          <i className="bi bi-geo-alt-fill text-danger me-2 mt-1"></i>
                          <div className="flex-grow-1">
                            <small className="text-muted d-block">Address</small>
                            <small className="fw-semibold">{client.address}</small>
                          </div>
                        </div>

                        {client.phone && client.phone !== 'N/A' && (
                          <div className="d-flex align-items-start">
                            <i className="bi bi-telephone-fill text-info me-2 mt-1"></i>
                            <div className="flex-grow-1">
                              <small className="text-muted d-block">Phone</small>
                              <small className="fw-semibold">{client.phone}</small>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-3 text-center">
                        <span className="badge bg-success-subtle text-success px-3 py-2">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Active Customer
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Tab>
      </Tabs>

      {/* CSS Animations */}
      <style>{`
        .modern-tabs .nav-link {
          color: #6c757d;
          border: none;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .modern-tabs .nav-link:hover {
          color: #0d6efd;
        }

        .modern-tabs .nav-link.active {
          color: #0d6efd;
          background-color: transparent;
          border-bottom: 3px solid #0d6efd;
        }

        .client-card-modern {
          animation: fadeInUp 0.4s ease-out;
        }

        .client-card-modern:hover {
          transform: translateY(-8px);
          box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.15) !important;
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

        ${clients.map((_, index) => `
          .client-card-modern:nth-child(${index + 1}) {
            animation-delay: ${index * 0.05}s;
          }
        `).join('\n')}
      `}</style>
    </Container>
  );
}
