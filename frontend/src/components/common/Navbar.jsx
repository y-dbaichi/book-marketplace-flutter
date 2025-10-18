// ==============================================================================
// NAVIGATION BAR COMPONENT
// ==============================================================================
// Main navigation bar for the application
// Provides role-based navigation and user account management
//
// Features:
// - Responsive Bootstrap navbar with mobile toggle
// - Role-based menu items (seller vs buyer/customer)
// - User authentication status display
// - User dropdown menu with profile and logout
// - Bootstrap Icons integration
// - Active link highlighting
//
// User Roles:
// - Guest: Login and Register links
// - Seller: Marketplace, My Books, Orders, Clients
// - Customer/Buyer: Marketplace, My Orders, My Suppliers
//
// Layout:
// - Left: Brand logo and navigation links
// - Right: User account dropdown or login/register buttons
//
// Dependencies:
// - AuthContext for user state and logout function
// - React Router for navigation
// - Bootstrap 5 for styling and components
// - Bootstrap Icons for icons
// ==============================================================================

import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/**
 * Default avatar image path
 * @constant {string}
 */
const DEFAULT_AVATAR = '/assets/avatar.png';

/**
 * Avatar image dimensions (pixels)
 * @constant {number}
 */
const AVATAR_SIZE = 32;

// ==============================================================================
// NAVBAR COMPONENT
// ==============================================================================

/**
 * Main navigation bar component
 *
 * Displays app-wide navigation with role-based menu items.
 * Shows different navigation options based on user type:
 * - Sellers see: My Books, Orders, Clients
 * - Buyers/Customers see: My Orders, My Suppliers
 * - Guests see: Login and Register buttons
 *
 * Features:
 * - Responsive mobile toggle
 * - User avatar and dropdown
 * - Bootstrap Icons for visual cues
 * - Active link highlighting (via React Router)
 *
 * @returns {JSX.Element} Navigation bar component
 *
 * @example
 * import Navbar from './components/common/Navbar';
 *
 * function App() {
 *   return (
 *     <>
 *       <Navbar />
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 */
export default function Navbar() {
  // ===========================================================================
  // HOOKS
  // ===========================================================================

  /**
   * Get authentication state and functions from context
   *
   * Provides:
   * - user: Current user object (null if not authenticated)
   * - logout: Function to log out current user
   */
  const { user, logout } = useAuth();

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================

  /**
   * Get user avatar URL with fallback
   *
   * Returns user's avatar if available, otherwise returns default avatar.
   * Ensures navbar always shows an avatar image for logged-in users.
   *
   * @returns {string} Avatar image URL
   */
  const getAvatarUrl = () => user?.avatar || DEFAULT_AVATAR;

  /**
   * Get user display name
   *
   * Returns user's first name if available, otherwise returns 'User'.
   * Provides a friendly greeting in the navbar.
   *
   * @returns {string} User's display name
   */
  const getDisplayName = () => user?.profile?.firstName || 'User';

  /**
   * Handle logout click
   *
   * Calls logout function from AuthContext which:
   * 1. Clears localStorage (token and user)
   * 2. Triggers redirect to login page
   * 3. Updates auth state globally
   */
  const handleLogout = () => {
    console.log('🚪 User logging out via navbar');
    logout();
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        {/* Brand Logo */}
        <Link className="navbar-brand fw-bold" to="/" aria-label="BookMarket Home">
          BookMarket
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Navbar Content */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left Side Navigation */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Marketplace Link (always visible) */}
            <li className="nav-item">
              <Link className="nav-link" to="/marketplace">
                <i className="bi bi-book"></i> Marketplace
              </Link>
            </li>

            {/* Seller-Only Links */}
            {user?.userType === 'seller' && (
              <>
                {/* My Books - Manage book listings */}
                <li className="nav-item">
                  <Link className="nav-link" to="/my-books">
                    <i className="bi bi-journal"></i> My Books
                  </Link>
                </li>

                {/* Orders - View and manage orders */}
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">
                    <i className="bi bi-cart"></i> Orders
                  </Link>
                </li>

                {/* Clients - View client list */}
                <li className="nav-item">
                  <Link className="nav-link" to="/clients">
                    <i className="bi bi-people"></i> Clients
                  </Link>
                </li>
              </>
            )}

            {/* Customer/Buyer-Only Links */}
            {user?.userType === 'customer' && (
              <>
                {/* My Orders - View order history */}
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">
                    <i className="bi bi-cart"></i> My Orders
                  </Link>
                </li>

                {/* My Suppliers - View favorite sellers */}
                <li className="nav-item">
                  <Link className="nav-link" to="/suppliers">
                    <i className="bi bi-shop"></i> My Suppliers
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Right Side Navigation - User Account */}
          <ul className="navbar-nav ms-auto">
            {user ? (
              /* Authenticated User Dropdown */
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="User menu"
                >
                  {/* User Avatar */}
                  <img
                    src={getAvatarUrl()}
                    alt={`${getDisplayName()}'s avatar`}
                    className="rounded-circle me-2"
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                  />
                  {/* User Name */}
                  {getDisplayName()}
                </a>

                {/* Dropdown Menu */}
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {/* Profile Link */}
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person-circle"></i> Profile
                    </Link>
                  </li>

                  {/* Logout Button */}
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleLogout}
                      aria-label="Logout"
                    >
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              /* Guest Links (Not Authenticated) */
              <>
                {/* Login Link */}
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right"></i> Login
                  </Link>
                </li>

                {/* Register Link */}
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <i className="bi bi-person-plus"></i> Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// ==============================================================================
// PROP TYPES
// ==============================================================================

/**
 * PropTypes for type checking
 *
 * Navbar doesn't accept props (uses context for data),
 * but PropTypes are defined for consistency.
 */
Navbar.propTypes = {};
