import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import { bookService, orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import BookSuppliersMap from '../../components/common/BookSuppliersMap';

export default function MarketplacePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuppliersMap, setShowSuppliersMap] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getAllBooks();
      setBooks(response.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderBook = (book) => {
    if (!isAuthenticated) {
      alert('Please login to place an order');
      return;
    }
    if (user?.userType !== 'buyer') {
      alert('Only buyers can place orders');
      return;
    }
    setSelectedBook(book);
    setShowOrderModal(true);
  };

  const handleFindSuppliers = (book) => {
    setSelectedBook(book);
    setShowSuppliersMap(true);
  };

  const submitOrder = async () => {
    try {
      setOrderLoading(true);
      await orderService.createOrder({
        bookId: selectedBook._id,
        quantity: 1,
        orderType: 'pickup',
        buyerNotes: 'Looking forward to picking up this book!'
      });

      alert('Order placed successfully! The seller will confirm your order soon.');
      setShowOrderModal(false);
      setSelectedBook(null);
    } catch (error) {
      alert('Error placing order: ' + (error.response?.data?.message || error.message));
    } finally {
      setOrderLoading(false);
    }
  };

  const getQualityBadge = (quality) => {
    const variants = {
      excellent: 'success',
      good: 'primary',
      fair: 'warning',
      poor: 'danger'
    };
    return variants[quality] || 'secondary';
  };

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  return (
    <div className="min-vh-100">
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="text-white">
                <h1 className="display-4 fw-bold mb-4 fade-in-up">
                  Discover Amazing Books
                </h1>
                <p className="fs-5 mb-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Connect with local book lovers and find your next great read
                </p>
                <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <InputGroup size="lg" className="mb-4">
                    <InputGroup.Text className="bg-white border-0">
                      <i className="bi bi-search text-primary"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search books by title, author, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-bar border-0"
                    />
                  </InputGroup>
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="fade-in-up" style={{ animationDelay: '0.6s' }}>
                <i className="bi bi-book-half" style={{ fontSize: '8rem', opacity: 0.3 }}></i>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        {/* Stats Section */}
        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <div className="stats-card-modern position-relative overflow-hidden">
              <div className="stats-gradient-bg position-absolute w-100 h-100"></div>
              <div className="position-relative text-center p-4">
                <div className="stats-icon-wrapper mb-3">
                  <i className="bi bi-book-half stats-icon"></i>
                </div>
                <h2 className="stats-number mb-2">{books.length}</h2>
                <p className="stats-label mb-0">Books Available</p>
                <div className="stats-decoration"></div>
              </div>
            </div>
          </Col>
          <Col md={4} className="mb-4">
            <div className="stats-card-modern position-relative overflow-hidden">
              <div className="stats-gradient-bg-2 position-absolute w-100 h-100"></div>
              <div className="position-relative text-center p-4">
                <div className="stats-icon-wrapper mb-3">
                  <i className="bi bi-people-fill stats-icon"></i>
                </div>
                <h2 className="stats-number mb-2">{new Set(books.map(book => book.seller?._id)).size}</h2>
                <p className="stats-label mb-0">Active Sellers</p>
                <div className="stats-decoration"></div>
              </div>
            </div>
          </Col>
          <Col md={4} className="mb-4">
            <div className="stats-card-modern position-relative overflow-hidden">
              <div className="stats-gradient-bg-3 position-absolute w-100 h-100"></div>
              <div className="position-relative text-center p-4">
                <div className="stats-icon-wrapper mb-3">
                  <i className="bi bi-geo-alt-fill stats-icon"></i>
                </div>
                <h2 className="stats-number mb-2">Local</h2>
                <p className="stats-label mb-0">Community</p>
                <div className="stats-decoration"></div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-5">
            <div className="empty-state">
              <i className="bi bi-book fs-1 text-muted mb-4"></i>
              <h3 className="text-muted mb-3">
                {searchTerm ? 'No books found' : 'No Books Available Yet'}
              </h3>
              <p className="text-muted mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms or browse all books'
                  : 'Be the first to discover amazing books! Start by adding your collection or wait for sellers to join.'
                }
              </p>
              {!searchTerm && (
                <>
                  {user?.userType === 'seller' && (
                    <div className="d-flex justify-content-center gap-3 mb-3">
                      <Button variant="primary" onClick={() => window.location.href = '/seller/books'}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Your First Book
                      </Button>
                      <Button variant="outline" onClick={() => window.location.href = '/seller/dashboard'}>
                        <i className="bi bi-speedometer2 me-2"></i>
                        Go to Dashboard
                      </Button>
                    </div>
                  )}
                  {user?.userType === 'buyer' && (
                    <div className="d-flex justify-content-center gap-3 mb-3">
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh Page
                      </Button>
                      <Button variant="primary" onClick={() => window.location.href = '/register'}>
                        <i className="bi bi-shop me-2"></i>
                        Become a Seller
                      </Button>
                    </div>
                  )}
                  {!isAuthenticated && (
                    <div className="d-flex justify-content-center gap-3 mb-3">
                      <Button variant="primary" onClick={() => window.location.href = '/register'}>
                        <i className="bi bi-person-plus me-2"></i>
                        Join as Seller
                      </Button>
                      <Button variant="outline" onClick={() => window.location.href = '/login'}>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <Row>
            {filteredBooks.map((book) => (
              <Col key={book._id} md={6} lg={4} className="mb-4">
                <Card className="h-100 book-card">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg={getQualityBadge(book.quality)} className="text-capitalize">
                        {book.quality}
                      </Badge>
                      <span className="fw-bold text-primary fs-5">
                        {book.price}€
                      </span>
                    </div>

                    <h5 className="card-title mb-2">{book.title}</h5>
                    <p className="text-muted mb-2">
                      <i className="bi bi-person me-1"></i>
                      by {book.author}
                    </p>

                    {book.category && (
                      <p className="text-muted small mb-2">
                        <i className="bi bi-tag me-1"></i>
                        {book.category}
                      </p>
                    )}

                    <p className="card-text flex-grow-1 mb-3">
                      {book.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">
                        <i className="bi bi-box me-1"></i>
                        {book.quantity} available
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1"></i>
                        {book.seller?.location?.name || 'Location not specified'}
                      </small>
                    </div>

                    <div className="d-flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-fill"
                        onClick={() => handleFindSuppliers(book)}
                      >
                        <i className="bi bi-geo-alt me-1"></i>
                        Find Suppliers
                      </Button>
                      <Button
                        variant={book.quantity === 0 ? 'outline' : 'primary'}
                        className="flex-fill"
                        onClick={() => handleOrderBook(book)}
                        disabled={book.quantity === 0}
                      >
                        <i className={`bi ${book.quantity === 0 ? 'bi-x-circle' : 'bi-cart-plus'} me-1`}></i>
                        {book.quantity === 0 ? 'Out of Stock' : 'Order'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Order Modal */}
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title="Confirm Order"
          size="md"
        >
          {selectedBook && (
            <div>
              <div className="mb-4 text-center">
                <h4 className="fw-bold">{selectedBook.title}</h4>
                <p className="text-muted mb-2">by {selectedBook.author}</p>
                <p className="price-display">{selectedBook.price}€</p>
              </div>

              <div className="mb-4">
                <div className="card bg-light border-0 p-3">
                  <h6 className="fw-semibold mb-2">
                    <i className="bi bi-shop me-2"></i>
                    Seller Information
                  </h6>
                  <p className="mb-1"><strong>Store:</strong> {selectedBook.seller?.location?.name}</p>
                  <p className="mb-1"><strong>Location:</strong> {selectedBook.seller?.location?.address}</p>
                  <p className="mb-0"><strong>Contact:</strong> {selectedBook.seller?.phone}</p>
                </div>
              </div>

              <div className="alert alert-info border-0 shadow-sm">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Order Process:</strong>
                <ol className="mb-0 mt-2">
                  <li>You place the order</li>
                  <li>Seller confirms and sets meeting location</li>
                  <li>You meet to complete the transaction</li>
                </ol>
              </div>

              <div className="d-flex gap-3 justify-content-end">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={submitOrder}
                  loading={orderLoading}
                  disabled={orderLoading}
                  className="px-4"
                >
                  {orderLoading ? (
                    <>
                      <span className="loading-spinner me-2"></span>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirm Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Book Suppliers Map Modal */}
        <BookSuppliersMap
          isOpen={showSuppliersMap}
          onClose={() => setShowSuppliersMap(false)}
          bookTitle={selectedBook?.title}
          bookAuthor={selectedBook?.author}
          statusFilters={['pending', 'confirmed', 'completed']} // Pass all statuses or connect to filter UI
        />
      </Container>
    </div>
  );
}
