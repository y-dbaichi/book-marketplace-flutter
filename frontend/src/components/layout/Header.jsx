import { Navbar, Nav, Container } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.email || 'User';
  };

  const getUserRole = () => {
    return user?.userType === 'buyer' ? 'Customer' : 'Seller';
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm border-bottom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <i className="bi bi-book me-2 fs-3 text-primary"></i>
          <span className="fw-bold">BookMarket</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated ? (
              <>
                {user?.userType === 'seller' ? (
                  <>
                    <Nav.Link as={Link} to="/buyer/dashboard" className="nav-link-enhanced">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/books" className="nav-link-enhanced">
                      <i className="bi bi-book me-2"></i>
                      My Books
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/orders" className="nav-link-enhanced">
                      <i className="bi bi-cart-check me-2"></i>
                      Orders
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/clients" className="nav-link-enhanced">
                      <i className="bi bi-people me-2"></i>
                      My Clients
                    </Nav.Link>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/marketplace" className="nav-link-enhanced">
                      <i className="bi bi-shop me-2"></i>
                      Marketplace
                    </Nav.Link>
                    <Nav.Link as={Link} to="/customer/orders" className="nav-link-enhanced">
                      <i className="bi bi-bag-check me-2"></i>
                      My Orders
                    </Nav.Link>
                    <Nav.Link as={Link} to="/customer/suppliers" className="nav-link-enhanced">
                      <i className="bi bi-shop me-2"></i>
                      My Suppliers
                    </Nav.Link>
                  </>
                )}
              </>
            ) : (
              <Nav.Link as={Link} to="/marketplace">
                <i className="bi bi-shop me-1"></i>
                Browse Books
              </Nav.Link>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/profile" className="nav-link-enhanced">
                  <i className="bi bi-person-circle me-2"></i>
                  {getUserDisplayName()}
                </Nav.Link>
                <Nav.Link onClick={handleLogout} className="nav-link-enhanced">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </Nav.Link>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}