import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
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
    return user?.userType === 'buyer' ? 'Seller' : 'Customer';
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
                {user?.userType === 'buyer' ? (
                  <>
                    <Nav.Link as={Link} to="/buyer/dashboard">
                      <i className="bi bi-speedometer2 me-1"></i>
                      Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/books">
                      <i className="bi bi-book me-1"></i>
                      My Books
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/orders">
                      <i className="bi bi-cart-check me-1"></i>
                      Orders
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/exports">
                      <i className="bi bi-download me-1"></i>
                      GeoJSON Exports
                    </Nav.Link>
                    <Nav.Link as={Link} to="/buyer/clients">
                      <i className="bi bi-people me-1"></i>
                      My Clients
                    </Nav.Link>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/marketplace">
                      <i className="bi bi-shop me-1"></i>
                      Marketplace
                    </Nav.Link>
                    <Nav.Link as={Link} to="/customer/orders">
                      <i className="bi bi-bag-check me-1"></i>
                      My Orders
                    </Nav.Link>
                    <Nav.Link as={Link} to="/customer/suppliers">
                      <i className="bi bi-shop me-1"></i>
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
              <NavDropdown
                title={
                  <span>
                    <i className="bi bi-person-circle me-1"></i>
                    {getUserDisplayName()}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="bi bi-gear me-2"></i>
                  Profile Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </NavDropdown.Item>
              </NavDropdown>
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
