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
                    <NavDropdown
                      title={
                        <span className="nav-dropdown-title">
                          <i className="bi bi-grid-3x3-gap me-2"></i>
                          Business
                        </span>
                      }
                      id="buyer-dropdown"
                      className="nav-dropdown-enhanced"
                    >
                      <NavDropdown.Item as={Link} to="/buyer/dashboard" className="nav-dropdown-item">
                        <i className="bi bi-speedometer2 me-2 text-primary"></i>
                        <div>
                          <div className="fw-semibold">Dashboard</div>
                          <small className="text-muted">Business overview & KPIs</small>
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/buyer/books" className="nav-dropdown-item">
                        <i className="bi bi-book me-2 text-success"></i>
                        <div>
                          <div className="fw-semibold">My Books</div>
                          <small className="text-muted">Manage inventory</small>
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/buyer/orders" className="nav-dropdown-item">
                        <i className="bi bi-cart-check me-2 text-info"></i>
                        <div>
                          <div className="fw-semibold">Orders</div>
                          <small className="text-muted">Customer orders</small>
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/buyer/clients" className="nav-dropdown-item">
                        <i className="bi bi-people me-2 text-warning"></i>
                        <div>
                          <div className="fw-semibold">My Clients</div>
                          <small className="text-muted">Customer locations</small>
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/buyer/exports" className="nav-dropdown-item">
                        <i className="bi bi-download me-2 text-danger"></i>
                        <div>
                          <div className="fw-semibold">Mobile Export</div>
                          <small className="text-muted">GeoJSON for Flutter</small>
                        </div>
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/marketplace" className="nav-link-enhanced">
                      <i className="bi bi-shop me-2"></i>
                      Marketplace
                    </Nav.Link>
                    <NavDropdown
                      title={
                        <span className="nav-dropdown-title">
                          <i className="bi bi-person-circle me-2"></i>
                          My Account
                        </span>
                      }
                      id="customer-dropdown"
                      className="nav-dropdown-enhanced"
                    >
                      <NavDropdown.Item as={Link} to="/customer/orders" className="nav-dropdown-item">
                        <i className="bi bi-bag-check me-2 text-primary"></i>
                        <div>
                          <div className="fw-semibold">My Orders</div>
                          <small className="text-muted">Track order progress</small>
                        </div>
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/customer/suppliers" className="nav-dropdown-item">
                        <i className="bi bi-shop me-2 text-success"></i>
                        <div>
                          <div className="fw-semibold">My Suppliers</div>
                          <small className="text-muted">Trusted book sellers</small>
                        </div>
                      </NavDropdown.Item>
                    </NavDropdown>
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
