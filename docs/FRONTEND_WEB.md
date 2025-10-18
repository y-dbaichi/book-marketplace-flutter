# Frontend Web Application Documentation

## Overview

React-based web application for the Book Marketplace platform. Serves both buyers and sellers with role-based interfaces.

**Technology Stack:**
- React 18+
- Vite (build tool)
- React Router v6 (navigation)
- Axios (HTTP client)
- Bootstrap 5 + Bootstrap Icons
- Context API (state management)

## Application Structure

```
frontend/
├── src/
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Root component with routing
│   ├── context/
│   │   └── AuthContext.jsx      # Global auth state management
│   ├── services/
│   │   └── api.js               # API client & service layer
│   ├── pages/                   # Route-level components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Marketplace.jsx      # Browse books
│   │   ├── BookDetails.jsx
│   │   ├── MyBooks.jsx          # Seller: manage listings
│   │   ├── Orders.jsx           # Buyer/Seller orders
│   │   ├── Profile.jsx
│   │   ├── Clients.jsx          # Seller: view customers
│   │   └── Suppliers.jsx        # Buyer: favorite sellers
│   ├── components/
│   │   ├── common/              # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── BookCard.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── LocationMap.jsx
│   │   │   ├── MapPicker.jsx
│   │   │   └── BookSuppliersMap.jsx
│   │   └── layout/
│   │       └── Header.jsx
│   ├── styles/
│   │   └── index.css            # Global styles
│   └── assets/                  # Images, fonts, etc.
├── index.html
├── vite.config.js
└── package.json
```

## Key Features

### For Buyers
✅ Browse book marketplace
✅ Search by title, author, ISBN
✅ View book details with seller info
✅ Place orders with delivery location
✅ Track order status
✅ View order history
✅ Manage profile and location
✅ View favorite suppliers

### For Sellers
✅ Manage book listings (CRUD)
✅ View and process orders
✅ Update order status
✅ Add seller notes to orders
✅ View customer list
✅ Export order data as GeoJSON
✅ Dashboard with statistics

## Core Services

### API Service (`src/services/api.js`)

Centralized API client with 4 service modules:

**1. Auth Service:**
```javascript
import { authService } from './services/api';

// Register
await authService.register({
  email: 'user@example.com',
  password: 'password123',
  userType: 'buyer' // or 'seller'
});

// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get profile
const profile = await authService.getProfile();

// Update profile
await authService.updateProfile({
  profile: {
    firstName: 'John',
    lastName: 'Doe'
  }
});

// Logout
authService.logout();

// Check auth
const isLoggedIn = authService.isAuthenticated();
```

**2. Book Service:**
```javascript
import { bookService } from './services/api';

// Get all books
const { books, pagination } = await bookService.getAllBooks({
  search: 'Harry Potter',
  page: 1,
  limit: 20
});

// Get single book
const book = await bookService.getBook('book-id');

// Create book (sellers only)
await bookService.createBook({
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  isbn: '9780743273565',
  price: 120.00,
  quantity: 10
});

// Update book
await bookService.updateBook('book-id', {
  price: 100.00,
  quantity: 15
});

// Delete book
await bookService.deleteBook('book-id');

// Get my listings
const myBooks = await bookService.getMyListings();
```

**3. Order Service:**
```javascript
import { orderService } from './services/api';

// Create order (buyers)
await orderService.createOrder({
  bookId: 'book-id',
  quantity: 2,
  buyerLocation: {
    coordinates: [-7.5898, 33.5731],
    address: '123 Main St, Casablanca'
  },
  notes: 'Please call before delivery'
});

// Get buyer's orders
const myOrders = await orderService.getBuyerOrders();

// Get seller's orders
const orders = await orderService.getSellerOrders();

// Update order status (sellers)
await orderService.updateOrderStatus('order-id', {
  status: 'confirmed',
  notes: 'Will deliver tomorrow'
});
```

**4. GeoJSON Service:**
```javascript
import { geoJsonService } from './services/api';

// Generate export
await geoJsonService.generateExport({
  name: 'December Deliveries',
  data: { /* GeoJSON data */ }
});

// Get my exports
const exports = await geoJsonService.getMyExports();

// Download export
const blob = await geoJsonService.downloadExport('export-id');
```

### Auth Context (`src/context/AuthContext.jsx`)

Global authentication state management using React Context and useReducer.

**Usage:**
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Welcome, {user.email}!</div>;
}
```

**Features:**
- Persistent authentication (localStorage)
- Automatic state hydration on app load
- Loading and error states
- Type-safe state updates via reducer
- Profile management

## Components

### Common Components

**Navbar** (`components/common/Navbar.jsx`)
- Role-based navigation menu
- User dropdown with profile/logout
- Responsive mobile toggle
- Bootstrap integration

**BookCard** (`components/common/BookCard.jsx`)
- Reusable book display card
- Cover image with fallback
- Action buttons (View, Edit, Delete)
- Truncated description
- PropTypes validation

**LocationMap** (`components/common/LocationMap.jsx`)
- Display location on map
- OpenStreetMap integration
- Custom marker

**MapPicker** (`components/common/MapPicker.jsx`)
- Interactive location picker
- Click to set coordinates
- Reverse geocoding for address
- Used in profile and order forms

**BookSuppliersMap** (`components/common/BookSuppliersMap.jsx`)
- Display multiple seller locations
- Cluster markers for nearby sellers
- Seller info on marker click

## Routing

**Public Routes:**
- `/` - Home page
- `/login` - Login form
- `/register` - Registration form
- `/marketplace` - Browse books (public)

**Protected Routes (Require Authentication):**
- `/profile` - User profile
- `/orders` - Order list (buyer/seller view)

**Seller-Only Routes:**
- `/my-books` - Manage book listings
- `/clients` - View customer list

**Buyer-Only Routes:**
- `/suppliers` - View favorite sellers

**Route Protection:**
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}
```

## Environment Configuration

Create `.env` file in `frontend/` directory:

```env
# API Base URL
VITE_API_URL=https://book-marketplace-backend.vercel.app/api

# Map Configuration
VITE_MAPBOX_TOKEN=your-mapbox-token (optional)

# App Configuration
VITE_APP_NAME=BookMarket
VITE_APP_VERSION=1.0.0
```

**Usage in code:**
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

## Build & Deployment

### Development Server
```bash
cd frontend
npm install
npm run dev
```

**Dev server:** http://localhost:3000

### Production Build
```bash
npm run build
```

**Output:** `frontend/dist/`

### Preview Production Build
```bash
npm run preview
```

### Deployment (Vercel)

**Automated:**
```bash
vercel --prod
```

**Configuration:** `vercel.json` in project root

**Live URL:** https://your-project.vercel.app

## Testing

### Manual Testing

1. **Authentication Flow:**
   - Register new user (buyer/seller)
   - Login with credentials
   - Verify token storage
   - Test logout
   - Verify protected routes

2. **Buyer Workflow:**
   - Browse marketplace
   - Search books
   - View book details
   - Place order with location
   - Track order status

3. **Seller Workflow:**
   - Create book listing
   - Update book details
   - View orders
   - Update order status
   - View customer list

### Test Credentials

```
Buyer:
Email: buyer@example.com
Password: password123

Seller:
Email: seller@example.com
Password: password123
```

## Styling

**Framework:** Bootstrap 5

**Custom Styles:** `src/styles/index.css`

**Icons:** Bootstrap Icons

**Key Classes:**
```css
/* Cards */
.card, .card-body, .card-title, .card-text

/* Buttons */
.btn, .btn-primary, .btn-secondary, .btn-danger

/* Forms */
.form-control, .form-label, .form-select

/* Layout */
.container, .row, .col, .d-flex, .gap-*

/* Spacing */
.m-*, .p-*, .mb-*, .mt-*, .mx-*, .my-*

/* Typography */
.text-muted, .fw-bold, .fs-*
```

## State Management

**Pattern:** Context API with useReducer

**Auth State:**
```javascript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
}
```

**Actions:**
- `LOGIN_START` - Begin login
- `LOGIN_SUCCESS` - Login successful
- `LOGIN_FAILURE` - Login failed
- `LOGOUT` - User logged out
- `REGISTER_START` - Begin registration
- `REGISTER_SUCCESS` - Registration successful
- `REGISTER_FAILURE` - Registration failed
- `LOAD_USER` - Load user from storage
- `CLEAR_ERROR` - Clear error message

## Security Features

✅ JWT token authentication
✅ Automatic token injection (Axios interceptors)
✅ 401 error handling (auto-logout)
✅ Protected routes
✅ Role-based access control
✅ XSS protection (React's built-in escaping)
✅ HTTPS in production

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- Chrome Android
- Safari iOS

## Troubleshooting

**API Connection Issues:**
- Check VITE_API_URL in .env
- Verify backend is running
- Check CORS configuration

**Authentication Problems:**
- Clear localStorage
- Check token expiration
- Verify credentials

**Map Issues:**
- Check internet connection
- Verify MapboxToken if using Mapbox
- OpenStreetMap alternative available

## Performance Optimization

✅ Code splitting with React.lazy()
✅ Image lazy loading
✅ Debounced search input
✅ Pagination for large lists
✅ Memoized components

## Accessibility

✅ Semantic HTML
✅ ARIA labels
✅ Keyboard navigation
✅ Screen reader support
✅ Color contrast compliance

## Future Enhancements

🎯 Real-time notifications (WebSocket)
🎯 Advanced search filters
🎯 Wishlist feature
🎯 Book recommendations
🎯 Seller ratings and reviews
🎯 Multi-language support (i18n)
🎯 Dark mode
🎯 Progressive Web App (PWA)

---

**Developer:** Yassine Dbaichi
**Project:** PFE - Geographic Information Science (SIG)

*Last Updated: January 2025*
