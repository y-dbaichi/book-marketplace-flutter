import { Container } from 'react-bootstrap';

export default function CustomerOrders() {
  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-bag-check me-2"></i>
        My Orders
      </h1>
      <p className="text-muted">Track your book orders and pickup status.</p>
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        This page is under construction. Order tracking features will be added soon.
      </div>
    </Container>
  );
}
