import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function LandingPage() {
  return (
    <div className="">
      {/* Hero Section */}
      <div className="hero-section p-1">
        <Container>
          <Row className="align-items-center" >
            <Col lg={6}>
              <div className="text-white">
                <h1 className=" fw-bold mb-3 fade-in-up">
                  Your Local Book Marketplace
                </h1>
                <p className="fs-5 mb-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Connect with book lovers in your community. Buy, sell, and discover amazing books locally.
                </p>
                <div className="d-flex gap-2 fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Link to="/register">
                    <Button variant="primary" size="md" className="px-4 py-2">
                      <i className="bi bi-person-plus me-2"></i>
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="md" className="px-4 py-2  border-white">
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
      <Container className="py-4">
        <Row className="text-center mb-4">
          <Col>
            <h2 className="h3 fw-bold mb-2">Why Choose BookMarket?</h2>
            <p className="text-muted">Everything you need to buy and sell books locally</p>
          </Col>
        </Row>

        <Row className='d-flex align-items-end'>
          <Col lg={4} md={6} className="mb-1">
            <Card className="feature-card-enhanced border-0 overflow-hidden">
              <div className="feature-gradient-bg-1"></div>
              <Card.Body className="p-4 position-relative">
                <div className="feature-icon-enhanced mb-1">
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h5 className="fw-bold mb-2 text-white">Local Community</h5>
                <p className="text-white-50 mb-3 small">
                  Connect with book lovers in your neighborhood. Meet in person for safe, local transactions with interactive maps.
                </p>
                <div className="">
                  <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '0.75rem' }}>
                    <span>📍 GPS Enabled</span>
                    <span>🗺️ Interactive Maps</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-1">
            <Card className="feature-card-enhanced  border-0 overflow-hidden">
              <div className="feature-gradient-bg-2"></div>
              <Card.Body className="p-4 position-relative">
                <div className="feature-icon-enhanced mb-1">
                  <i className="bi bi-phone"></i>
                </div>
                <h4 className="h5 fw-bold mb-2 text-white">Mobile Integration</h4>
                <p className="text-white-50 mb-3 small">
                  Manage your business on the web, then use our Flutter mobile app for navigation and route planning.
                </p>
                <div className="">
                  <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '0.75rem' }}>
                    <span>📱 Flutter App</span>
                    <span>🧭 GPS Navigation</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-1">
            <Card className="feature-card-enhanced  border-0 overflow-hidden">
              <div className="feature-gradient-bg-3"></div>
              <Card.Body className="p-4 position-relative">
                <div className="feature-icon-enhanced mb-1">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <h4 className="h5 fw-bold mb-2 text-white">Business Analytics</h4>
                <p className="text-white-50 mb-3 small">
                  Track your sales, manage inventory, and grow your book business with detailed insights and KPIs.
                </p>
                <div className="">
                  <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '0.75rem' }}>
                    <span>📊 Real-time KPIs</span>
                    <span>💰 Revenue Tracking</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* CTA Section */}
        <Row className="mt-4">
          <Col className="text-center">
            <div className="cta-section p-4 rounded-3">
              <h3 className="h4 fw-bold mb-2">Ready to Start Your Book Journey?</h3>
              <p className="mb-3 text-muted">
                Join thousands of book lovers in your community
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Link to="/register">
                  <Button variant="primary" size="md" className="px-4">
                    <i className="bi bi-shop me-2"></i>
                    Start Selling
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="success" size="md" className="px-4">
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