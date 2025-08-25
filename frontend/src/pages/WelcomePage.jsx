import Button from '../components/common/Button';

export default function WelcomePage() {
  return (
    <div className="welcome-hero d-flex flex-column align-items-center justify-content-center min-vh-100 text-center bg-gradient-primary position-relative">
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient" style={{ opacity: 0.15, zIndex: 0 }} />
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <h1 className="display-3 fw-bold mb-3 animate__animated animate__fadeInDown">
          Welcome to <span className="text-primary">BookMarket</span>
        </h1>
        <p className="lead mb-4 animate__animated animate__fadeInUp">
          The ultimate platform for buying, selling, and discovering books with real-time location features.
        </p>
        <div className="d-flex gap-3 justify-content-center mb-5 animate__animated animate__fadeInUp">
          <Button variant="primary" size="lg" href="/register">Get Started</Button>
          <Button variant="outline" size="lg" href="/login">Login</Button>
          <Button variant="secondary" size="lg" href="/marketplace">Explore Marketplace</Button>
        </div>
        <div className="row mt-5">
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow-sm bg-white h-100">
              <i className="bi bi-geo-alt fs-1 text-primary mb-3"></i>
              <h5>Location Intelligence</h5>
              <p className="text-muted">Find books and sellers near you with interactive maps and real-time pins.</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow-sm bg-white h-100">
              <i className="bi bi-bar-chart fs-1 text-success mb-3"></i>
              <h5>Business Analytics</h5>
              <p className="text-muted">Track your sales, orders, and clients with professional dashboards.</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow-sm bg-white h-100">
              <i className="bi bi-phone fs-1 text-info mb-3"></i>
              <h5>Mobile Ready</h5>
              <p className="text-muted">Sync your data with our Flutter app for seamless mobile experience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
