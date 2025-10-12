import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LocationMap from '../../components/common/LocationMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BuyerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <i className="bi bi-people me-2"></i>
            My Clients
          </h1>
          <p className="text-muted mb-0">View and manage your customer relationships</p>
        </div>
      </div>

      <Tabs defaultActiveKey="map" className="mb-4">
        <Tab eventKey="map" title={
          <span>
            <i className="bi bi-map me-2"></i>
            Map View
          </span>
        }>
          <Card>
            <Card.Body>
              <LocationMap
                points={clients}
                type="clients"
                title="Client Locations"
                loading={loading}
              />
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="list" title={
          <span>
            <i className="bi bi-list me-2"></i>
            List View
          </span>
        }>
          <Row>
            {clients.length === 0 ? (
              <Col>
                <Card className="text-center p-5">
                  <i className="bi bi-people fs-1 text-muted mb-3"></i>
                  <h3 className="text-muted mb-3">No clients yet</h3>
                  <p className="text-muted">Start selling books to see your clients here</p>
                </Card>
              </Col>
            ) : (
              clients.map((client) => (
                <Col md={6} lg={4} key={client.id} className="mb-4">
                  <Card className="h-100 client-card">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="client-avatar me-3">
                          <i className="bi bi-person-circle fs-2 text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{client.name}</h6>
                          <small className="text-muted">{client.email}</small>
                        </div>
                      </div>

                      <div className="client-stats mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Orders:</span>
                          <strong>{client.totalOrders}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Spent:</span>
                          <strong className="text-success">{client.totalSpent.toFixed(2)}€</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Last Order:</span>
                          <small>{client.lastOrder.toLocaleDateString()}</small>
                        </div>
                      </div>

                      <div className="client-location">
                        <i className="bi bi-geo-alt me-1 text-muted"></i>
                        <small className="text-muted">{client.address}</small>
                      </div>

                      {client.phone && (
                        <div className="client-phone mt-2">
                          <i className="bi bi-telephone me-1 text-muted"></i>
                          <small className="text-muted">{client.phone}</small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
}
