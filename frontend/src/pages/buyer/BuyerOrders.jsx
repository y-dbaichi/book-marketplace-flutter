import { useEffect, useState } from 'react';
import { orderService } from '../../services/api';
import Button from '../../components/common/Button';
import { Container, Badge, Modal, Card, Row, Col } from 'react-bootstrap';

export default function BuyerOrders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchOrders(true); // Show loading on initial load

    // Auto-refresh every 30 seconds to show order status updates
    const refreshInterval = setInterval(() => {
      fetchOrders(false); // Don't show loading spinner on auto-refresh
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function fetchOrders(showLoadingSpinner = true) {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const response = await orderService.getSellerOrders();
      setOrders(response.orders || []);
    } catch (err) {
      setOrders([]);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }

  const handleManualRefresh = () => {
    fetchOrders(false);
    setLastRefresh(Date.now());
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    setError('');
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders => orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      setShowModal(false);
      // Refresh the order list to get updated data
      const response = await orderService.getSellerOrders();
      setOrders(response.orders || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update order status.';
      setError(errorMessage);
      console.error('Order update error:', errorMessage);
    }
    setUpdating(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      delivered: 'success',
      refused: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'bi-clock-history',
      confirmed: 'bi-check-circle-fill',
      delivered: 'bi-truck',
      refused: 'bi-x-circle-fill'
    };
    return icons[status] || 'bi-question-circle';
  };

  const generateOrderNumber = (orderId, index) => {
    return `#${String(orders.length - index).padStart(4, '0')}`;
  };

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      order.book?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.book?.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.profile?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.profile?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerLocation?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerLocation?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats for filter chips
  const orderStats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    refused: orders.filter(o => o.status === 'refused').length,
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <i className="bi bi-cart-check me-2 text-primary"></i>
            Order Management
          </h1>
          <p className="text-muted mb-0">
            Manage customer orders and delivery confirmations
            <span className="ms-3 small">
              <i className="bi bi-clock me-1"></i>
              Auto-refreshes every 30s • Last: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <Button variant="outline-secondary" onClick={handleManualRefresh}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <div className="text-end">
            <div className="fs-5 fw-bold text-primary">{orders.length}</div>
            <small className="text-muted">Total Orders</small>
          </div>
        </div>
      </div>

      {/* Modern Search & Filter Bar */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            {/* Search Input */}
            <Col xs={12} md={5}>
              <div className="position-relative">
                <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by book, customer, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: '10px' }}
                />
                {searchQuery && (
                  <button
                    className="btn btn-link position-absolute text-muted p-0"
                    style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </Col>

            {/* Filter Toggle Button */}
            <Col xs={12} md={3}>
              <button
                className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'} w-100`}
                onClick={() => setShowFilters(!showFilters)}
                style={{ borderRadius: '10px' }}
              >
                <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-2`}></i>
                Filters
                {(statusFilter !== 'all') && (
                  <Badge bg="light" text="primary" className="ms-2">1</Badge>
                )}
              </button>
            </Col>

            {/* Results Count */}
            <Col xs={12} md={4} className="text-md-end">
              <div className="d-flex align-items-center justify-content-md-end gap-2">
                <Badge bg="primary" className="py-2 px-3 fs-6">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                </Badge>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearFilters}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Clear
                  </button>
                )}
              </div>
            </Col>
          </Row>

          {/* Status Filter Chips */}
          {showFilters && (
            <Row className="mt-3 pt-3 border-top">
              <Col xs={12}>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <small className="text-muted fw-semibold me-2">Status:</small>

                  <button
                    className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setStatusFilter('all')}
                    style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    All
                    <Badge bg={statusFilter === 'all' ? 'light' : 'secondary'} text={statusFilter === 'all' ? 'primary' : 'light'} className="ms-2">
                      {orderStats.all}
                    </Badge>
                  </button>

                  <button
                    className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setStatusFilter('pending')}
                    style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <i className="bi bi-clock-history me-1"></i>
                    Pending
                    <Badge bg={statusFilter === 'pending' ? 'light' : 'warning'} text={statusFilter === 'pending' ? 'warning' : 'light'} className="ms-2">
                      {orderStats.pending}
                    </Badge>
                  </button>

                  <button
                    className={`btn btn-sm ${statusFilter === 'confirmed' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setStatusFilter('confirmed')}
                    style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Confirmed
                    <Badge bg={statusFilter === 'confirmed' ? 'light' : 'primary'} text={statusFilter === 'confirmed' ? 'primary' : 'light'} className="ms-2">
                      {orderStats.confirmed}
                    </Badge>
                  </button>

                  <button
                    className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setStatusFilter('delivered')}
                    style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <i className="bi bi-truck me-1"></i>
                    Delivered
                    <Badge bg={statusFilter === 'delivered' ? 'light' : 'success'} text={statusFilter === 'delivered' ? 'success' : 'light'} className="ms-2">
                      {orderStats.delivered}
                    </Badge>
                  </button>

                  <button
                    className={`btn btn-sm ${statusFilter === 'refused' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setStatusFilter('refused')}
                    style={{ borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <i className="bi bi-x-circle-fill me-1"></i>
                    Refused
                    <Badge bg={statusFilter === 'refused' ? 'light' : 'danger'} text={statusFilter === 'refused' ? 'danger' : 'light'} className="ms-2">
                      {orderStats.refused}
                    </Badge>
                  </button>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
            <h4 className="text-muted">No orders found</h4>
            <p className="text-muted">Orders will appear here once customers place them</p>
          </Card.Body>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm animate-fade-in">
          <Card.Body>
            <i className="bi bi-filter-circle display-1 text-muted mb-3"></i>
            <h4 className="text-muted">No orders match your filters</h4>
            <p className="text-muted mb-3">Try adjusting your search or filter criteria</p>
            <button className="btn btn-outline-primary" onClick={clearFilters}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Clear All Filters
            </button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {filteredOrders.map((order, index) => (
            <Col key={order._id} xs={12}>
              <Card className="shadow-sm border-0 h-100 hover-shadow" style={{ transition: 'all 0.2s' }}>
                <Card.Body>
                  <Row className="align-items-center">
                    {/* Order Number & Status */}
                    <Col xs={12} md={2} className="mb-3 mb-md-0">
                      <div className="d-flex flex-column">
                        <div className="fw-bold text-primary fs-5 mb-1">
                          {generateOrderNumber(order._id, index)}
                        </div>
                        <Badge
                          bg={getStatusBadge(order.status)}
                          className="d-inline-flex align-items-center gap-1 py-2"
                          style={{ width: 'fit-content' }}
                        >
                          <i className={`bi ${getStatusIcon(order.status)}`}></i>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <small className="text-muted mt-2">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </Col>

                    {/* Book Info */}
                    <Col xs={12} md={3} className="mb-3 mb-md-0">
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 rounded p-2 me-2">
                          <i className="bi bi-book fs-4 text-primary"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-truncate" title={order.book?.title}>
                            {order.book?.title || 'N/A'}
                          </div>
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {order.book?.author || 'Unknown'}
                          </small>
                        </div>
                      </div>
                    </Col>

                    {/* Customer Info */}
                    <Col xs={12} md={3} className="mb-3 mb-md-0">
                      <div className="d-flex align-items-start">
                        <div className="bg-success bg-opacity-10 rounded p-2 me-2">
                          <i className="bi bi-person-circle fs-4 text-success"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-truncate">
                            {order.buyer?.profile?.firstName && order.buyer?.profile?.lastName
                              ? `${order.buyer.profile.firstName} ${order.buyer.profile.lastName}`
                              : order.buyer?.email?.split('@')[0] || 'N/A'}
                          </div>
                          <small className="text-muted d-block text-truncate">
                            <i className="bi bi-telephone me-1"></i>
                            {order.buyer?.phone || 'No phone'}
                          </small>
                        </div>
                      </div>
                    </Col>

                    {/* Order Details */}
                    <Col xs={12} md={2} className="mb-3 mb-md-0">
                      <div className="text-center">
                        <div className="text-muted small mb-1">Quantity</div>
                        <div className="fw-bold fs-5">{order.quantity}</div>
                        <div className="text-success fw-bold mt-1">{order.totalPrice} MAD</div>
                      </div>
                    </Col>

                    {/* Actions */}
                    <Col xs={12} md={2}>
                      <div className="d-flex flex-column gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              className="w-100"
                              onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="w-100"
                              onClick={() => handleUpdateStatus(order._id, 'refused')}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Refuse
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="info"
                            className="w-100"
                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                          >
                            <i className="bi bi-truck me-1"></i>
                            Delivered
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="w-100"
                          onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Details
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  {/* Location Info - Collapsible */}
                  {order.buyerLocation && (
                    <Row className="mt-3 pt-3 border-top">
                      <Col>
                        <small className="text-muted">
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                          <strong>Delivery:</strong> {order.buyerLocation?.name || order.buyerLocation?.address || 'N/A'}
                        </small>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <style>{`
        .hover-shadow {
          animation: fadeInUp 0.3s ease-out;
        }

        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        /* Smooth transitions for filter buttons */
        .btn {
          transition: all 0.2s ease-in-out;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:active {
          transform: translateY(0);
        }

        /* Search input focus effect */
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
          border-color: #86b7fe;
        }

        /* Staggered animation for order cards */
        ${filteredOrders.map((_, index) => `
          .hover-shadow:nth-child(${index + 1}) {
            animation-delay: ${index * 0.05}s;
          }
        `).join('\n')}
      `}</style>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-receipt me-2 text-primary"></i>
                Order Details
              </div>
              {selectedOrder && (
                <Badge
                  bg={getStatusBadge(selectedOrder.status)}
                  className="d-inline-flex align-items-center gap-1 py-2 px-3"
                >
                  <i className={`bi ${getStatusIcon(selectedOrder.status)}`}></i>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Badge>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          {selectedOrder && (
            <>
              {/* Order Summary Card */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body className="p-3">
                  <Row className="g-3">
                    <Col xs={6} md={3}>
                      <div className="text-center">
                        <small className="text-muted d-block mb-1">Order Number</small>
                        <div className="fw-bold text-primary">
                          {generateOrderNumber(selectedOrder._id, orders.findIndex(o => o._id === selectedOrder._id))}
                        </div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="text-center">
                        <small className="text-muted d-block mb-1">Quantity</small>
                        <div className="fw-bold">{selectedOrder.quantity}</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="text-center">
                        <small className="text-muted d-block mb-1">Total Price</small>
                        <div className="fw-bold text-success">{selectedOrder.totalPrice} MAD</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="text-center">
                        <small className="text-muted d-block mb-1">Order Date</small>
                        <div className="fw-semibold small">{new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Row className="g-3">
                {/* Book Details */}
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 rounded p-2 me-2">
                          <i className="bi bi-book fs-4 text-primary"></i>
                        </div>
                        <h6 className="mb-0 fw-semibold">Book Information</h6>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Title</small>
                        <div className="fw-semibold">{selectedOrder.book?.title || 'N/A'}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Author</small>
                        <div>{selectedOrder.book?.author || 'N/A'}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Customer Details */}
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-success bg-opacity-10 rounded p-2 me-2">
                          <i className="bi bi-person-circle fs-4 text-success"></i>
                        </div>
                        <h6 className="mb-0 fw-semibold">Customer Information</h6>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Name</small>
                        <div className="fw-semibold">
                          {selectedOrder.buyer?.profile?.firstName && selectedOrder.buyer?.profile?.lastName
                            ? `${selectedOrder.buyer.profile.firstName} ${selectedOrder.buyer.profile.lastName}`
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Email</small>
                        <div>{selectedOrder.buyer?.email || 'N/A'}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Phone</small>
                        <div>
                          <i className="bi bi-telephone me-1 text-muted"></i>
                          {selectedOrder.buyer?.phone || 'N/A'}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Delivery Location */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-danger bg-opacity-10 rounded p-2 me-2">
                          <i className="bi bi-geo-alt-fill fs-4 text-danger"></i>
                        </div>
                        <h6 className="mb-0 fw-semibold">Delivery Location</h6>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-2">
                            <small className="text-muted d-block">Location Name</small>
                            <div className="fw-semibold">{selectedOrder.buyerLocation?.name || 'N/A'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-2">
                            <small className="text-muted d-block">Address</small>
                            <div>{selectedOrder.buyerLocation?.address || 'N/A'}</div>
                          </div>
                        </Col>
                        {selectedOrder.buyerLocation?.coordinates && (
                          <Col xs={12}>
                            <div className="mt-2">
                              <small className="text-muted">
                                <i className="bi bi-pin-map me-1"></i>
                                Coordinates: {selectedOrder.buyerLocation.coordinates[1].toFixed(6)}, {selectedOrder.buyerLocation.coordinates[0].toFixed(6)}
                              </small>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Customer Notes */}
                {selectedOrder.buyerNotes && (
                  <Col xs={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-warning bg-opacity-10 rounded p-2 me-2">
                            <i className="bi bi-chat-left-text fs-4 text-warning"></i>
                          </div>
                          <h6 className="mb-0 fw-semibold">Customer Notes</h6>
                        </div>
                        <div className="bg-light rounded p-3">
                          <i className="bi bi-quote text-muted"></i>
                          <p className="mb-0 ms-3">{selectedOrder.buyerNotes}</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </>
          )}
          {error && (
            <div className="alert alert-danger mt-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <div className="d-flex gap-2 w-100 justify-content-end">
            {selectedOrder && selectedOrder.status === 'pending' && (
              <>
                <Button
                  variant="success"
                  loading={updating}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm Order
                </Button>
                <Button
                  variant="danger"
                  loading={updating}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'refused')}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Refuse Order
                </Button>
              </>
            )}
            {selectedOrder && selectedOrder.status === 'confirmed' && (
              <Button
                variant="info"
                loading={updating}
                onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
              >
                <i className="bi bi-truck me-2"></i>
                Mark as Delivered
              </Button>
            )}
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
