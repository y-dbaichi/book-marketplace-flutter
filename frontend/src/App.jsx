import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import { PageLoader } from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MarketplacePage from './pages/customer/MarketplacePage';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerBooks from './pages/buyer/BuyerBooks';
import BuyerOrders from './pages/buyer/BuyerOrders';
import BuyerClients from './pages/buyer/BuyerClients';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerSuppliers from './pages/customer/CustomerSuppliers';
import ProfilePage from './pages/shared/ProfilePage';

// Protected Route Component
function ProtectedRoute({ children, requiredRole = null }) {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.userType !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Main App Routes
function AppRoutes() {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-vh-100 bg-light">
            <Header />
            <main>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    } />
                    <Route path="/register" element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    } />
                    <Route path="/marketplace" element={<MarketplacePage />} />

                    {/* Protected Routes */}
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />

                    {/* Seller Routes (named 'buyer' in folder structure but for sellers) */}
                    <Route path="/buyer/dashboard" element={
                        <ProtectedRoute requiredRole="seller">
                            <BuyerDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/buyer/books" element={
                        <ProtectedRoute requiredRole="seller">
                            <BuyerBooks />
                        </ProtectedRoute>
                    } />
                    <Route path="/buyer/orders" element={
                        <ProtectedRoute requiredRole="seller">
                            <BuyerOrders />
                        </ProtectedRoute>
                    } />
                    <Route path="/buyer/clients" element={
                        <ProtectedRoute requiredRole="seller">
                            <BuyerClients />
                        </ProtectedRoute>
                    } />

                    {/* Buyer Routes (named 'customer' in folder structure but for buyers) */}
                    <Route path="/customer/orders" element={
                        <ProtectedRoute requiredRole="buyer">
                            <CustomerOrders />
                        </ProtectedRoute>
                    } />
                    <Route path="/customer/suppliers" element={
                        <ProtectedRoute requiredRole="buyer">
                            <CustomerSuppliers />
                        </ProtectedRoute>
                    } />

                    {/* Default Route */}
                    <Route path="/" element={
                        isAuthenticated ? (
                            user?.userType === 'seller' ?
                                <Navigate to="/buyer/dashboard" replace /> :
                                <Navigate to="/marketplace" replace />
                        ) : (
                            <LandingPage />
                        )
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;