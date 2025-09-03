import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs } from 'react-bootstrap';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LocationMap from '../../components/common/LocationMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CustomerSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await orderService.getCustomerOrders();
      const orders = response.orders || [];
      // Group orders by buyer to create supplier data
      const suppliersMap = new Map();
      orders.forEach(order => {
        const buyer = order.book?.buyer;
        if (buyer && buyer.location) {
          const supplierId = buyer._id;
          if (suppliersMap.has(supplierId)) {
            const existingSupplier = suppliersMap.get(supplierId);
            existingSupplier.totalOrders += 1;
            existingSupplier.totalSpent += order.totalPrice || 0;
            existingSupplier.lastOrder = new Date(Math.max(
              new Date(existingSupplier.lastOrder),
              new Date(order.createdAt)
            ));
          } else {
            suppliersMap.set(supplierId, {
              id: supplierId,
              name: buyer.location.name || `${buyer.profile?.firstName || ''} ${buyer.profile?.lastName || ''}`.trim() || buyer.email,
              email: buyer.email,
              phone: buyer.phone,
              address: buyer.location.address,
              latitude: buyer.location.coordinates.latitude,
              longitude: buyer.location.coordinates.longitude,
              totalOrders: 1,
              totalSpent: order.totalPrice || 0,
              lastOrder: new Date(order.createdAt),
              status: 'active'
            });
          }
        }
      });
      setSuppliers(Array.from(suppliersMap.values()));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
            <i className="bi bi-shop me-2"></i>
            My Suppliers
          </h1>
          <p className="text-muted mb-0">View your trusted book suppliers and their locations</p>
        </div>
      </div>
      <Tabs defaultActiveKey="map" className="mb-4">
        <Tab eventKey="map" title={<span><i className="bi bi-map me-2"></i>Map View</span>}>
          <Card>
            <Card.Body>
              <LocationMap
                points={suppliers}
                type="suppliers"
                title="Supplier Locations"
                loading={loading}
              />
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="list" title={<span><i className="bi bi-list me-2"></i>List View</span>}>
          <Row>
            {suppliers.length === 0 ? (
              <Col>
                <Card className="text-center p-5">
                  <i className="bi bi-shop fs-1 text-muted mb-3"></i>
                  <h3 className="text-muted mb-3">No suppliers yet</h3>
                  <p className="text-muted">Start ordering books to see your suppliers here</p>
                </Card>
              </Col>
            ) : (
              suppliers.map((supplier) => (
                <Col md={6} lg={4} key={supplier.id} className="mb-4">
                  <Card className="h-100 supplier-card">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="supplier-avatar me-3">
                          <i className="bi bi-shop fs-2 text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{supplier.name}</h6>
                          <small className="text-muted">{supplier.email}</small>
                        </div>
                      </div>
                      <div className="supplier-stats mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Orders:</span>
                          <strong>{supplier.totalOrders}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Spent:</span>
                          <strong className="text-success">{supplier.totalSpent.toFixed(2)}€</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Last Order:</span>
                          <small>{supplier.lastOrder.toLocaleDateString()}</small>
                        </div>
                      </div>
                      <div className="supplier-location">
                        <i className="bi bi-geo-alt me-1 text-muted"></i>
                        <small className="text-muted">{supplier.address}</small>
                      </div>
                      {supplier.phone && (
                        <div className="supplier-phone mt-2">
                          <i className="bi bi-telephone me-1 text-muted"></i>
                          <small className="text-muted">{supplier.phone}</small>
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