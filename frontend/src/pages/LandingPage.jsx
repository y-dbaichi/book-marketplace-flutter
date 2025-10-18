import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function LandingPage() {
  return (
    <div className="min-vh-100">
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <div className="text-white">
                <h1 className="display-3 fw-bold mb-4 fade-in-up">
                  Your Local Book Marketplace
                </h1>
                <p className="fs-4 mb-5 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Connect with book lovers in your community. Buy, sell, and discover amazing books locally.
                </p>
                <div className="d-flex gap-3 fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Link to="/register">
                    <Button variant="primary" size="lg" className="px-5 py-3">
                      <i className="bi bi-person-plus me-2"></i>
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login">
                   <Button variant="primary" size="lg" className="px-5 py-3">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="hero-illustration">
                  <i className="bi bi-book-half hero-icon"></i>
                  <div className="floating-elements">
                    <div className="floating-book floating-book-1">
                      <i className="bi bi-book"></i>
                    </div>
                    <div className="floating-book floating-book-2">
                      <i className="bi bi-journal-bookmark"></i>
                    </div>
                    <div className="floating-book floating-book-3">
                      <i className="bi bi-journals"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">Why Choose BookMarket?</h2>
            <p className="fs-5 text-muted">Everything you need to buy and sell books locally</p>
          </Col>
        </Row>

        <Row>
          <Col lg={4} md={6} className="mb-4">
            <Card className="feature-card-enhanced h-100 border-0 overflow-hidden">
              <div className="feature-gradient-bg-1"></div>
              <Card.Body className="p-5 position-relative">
                <div className="feature-icon-enhanced mb-4">
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h4 className="fw-bold mb-3 text-white">Local Community</h4>
                <p className="text-white-50 mb-4">
                  Connect with book lovers in your neighborhood. Meet in person for safe, local transactions with interactive maps.
                </p>
                <div className="feature-stats">
                  <div className="d-flex justify-content-between text-white-50 small">
                    <span>📍 GPS Enabled</span>
                    <span>🗺️ Interactive Maps</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-4">
            <Card className="feature-card-enhanced h-100 border-0 overflow-hidden">
              <div className="feature-gradient-bg-2"></div>
              <Card.Body className="p-5 position-relative">
                <div className="feature-icon-enhanced mb-4">
                  <i className="bi bi-phone"></i>
                </div>
                <h4 className="fw-bold mb-3 text-white">Mobile Integration</h4>
                <p className="text-white-50 mb-4">
                  Manage your business on the web, then use our Flutter mobile app for navigation and route planning.
                </p>
                <div className="feature-stats">
                  <div className="d-flex justify-content-between text-white-50 small">
                    <span>📱 Flutter App</span>
                    <span>🧭 GPS Navigation</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-4">
            <Card className="feature-card-enhanced h-100 border-0 overflow-hidden">
              <div className="feature-gradient-bg-3"></div>
              <Card.Body className="p-5 position-relative">
                <div className="feature-icon-enhanced mb-4">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <h4 className="fw-bold mb-3 text-white">Business Analytics</h4>
                <p className="text-white-50 mb-4">
                  Track your sales, manage inventory, and grow your book business with detailed insights and KPIs.
                </p>
                <div className="feature-stats">
                  <div className="d-flex justify-content-between text-white-50 small">
                    <span>📊 Real-time KPIs</span>
                    <span>💰 Revenue Tracking</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* CTA Section */}
        <Row className="mt-5">
          <Col className="text-center">
            <div className="cta-section p-5 rounded-4">
              <h3 className="fw-bold mb-3">Ready to Start Your Book Journey?</h3>
              <p className="fs-5 mb-4 text-muted">
                Join thousands of book lovers in your community
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="px-5">
                    <i className="bi bi-shop me-2"></i>
                    Start Selling
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="success" size="lg" className="px-5">
                    <i className="bi bi-bag-heart me-2"></i>
                    Start Buying
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
