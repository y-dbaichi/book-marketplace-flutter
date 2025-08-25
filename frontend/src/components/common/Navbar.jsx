import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">BookMarket</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/marketplace"><i className="bi bi-book"></i> Marketplace</Link></li>
            {user?.userType === 'seller' && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/my-books"><i className="bi bi-journal"></i> My Books</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/orders"><i className="bi bi-cart"></i> Orders</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/clients"><i className="bi bi-people"></i> Clients</Link></li>
              </>
            )}
            {user?.userType === 'customer' && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/orders"><i className="bi bi-cart"></i> My Orders</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/suppliers"><i className="bi bi-shop"></i> My Suppliers</Link></li>
              </>
            )}
          </ul>
          <ul className="navbar-nav ms-auto">
            {user ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                  <img src={user.avatar || '/assets/avatar.png'} alt="avatar" className="rounded-circle me-2" width={32} height={32} />
                  {user.profile?.firstName}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><button className="dropdown-item" onClick={logout}>Logout</button></li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
