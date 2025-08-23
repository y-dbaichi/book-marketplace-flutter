import { Container } from 'react-bootstrap';

export default function BuyerOrders() {
  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-cart-check me-2"></i>
        Order Management
      </h1>
      <p className="text-muted">Manage customer orders and confirmations.</p>
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        This page is under construction. Order management features will be added soon.
      </div>
    </Container>
  );
}
