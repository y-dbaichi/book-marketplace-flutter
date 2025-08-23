import { Container } from 'react-bootstrap';

export default function ProfilePage() {
  return (
    <Container className="py-4">
      <h1>
        <i className="bi bi-person-circle me-2"></i>
        Profile Settings
      </h1>
      <p className="text-muted">Manage your account information and preferences.</p>
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        This page is under construction. Profile management features will be added soon.
      </div>
    </Container>
  );
}
