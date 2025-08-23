import { Container } from 'react-bootstrap';

export default function BuyerExports() {
  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-download me-2"></i>
        GeoJSON Exports
      </h1>
      <p className="text-muted">Generate and download GeoJSON files for your Flutter mobile app.</p>
      <div className="alert alert-success">
        <i className="bi bi-phone me-2"></i>
        <strong>Mobile Integration:</strong> Export your confirmed orders as GeoJSON files to import into your Flutter mobile app for navigation and route planning.
      </div>
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        This page is under construction. GeoJSON export features will be added soon.
      </div>
    </Container>
  );
}
