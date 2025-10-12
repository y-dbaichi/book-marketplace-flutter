import { useState, useEffect } from 'react';
import { Modal, Card, Badge, Row, Col } from 'react-bootstrap';
import { bookService } from '../../services/api';
import LocationMap from './LocationMap';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

export default function BookSuppliersMap({ 
  isOpen, 
  onClose, 
  bookTitle, 
  bookAuthor, 
  statusFilters = ['pending', 'confirmed', 'completed'] // new prop for filtering
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bookTitle) {
      fetchBookSuppliers();
    }
  }, [isOpen, bookTitle, statusFilters]);

  const fetchBookSuppliers = async () => {
    try {
      setLoading(true);
      // Search for books with the same title and author
      const response = await bookService.getAllBooks({
        search: `${bookTitle} ${bookAuthor}`.trim()
      });
      
      const books = response.books || [];
      
      // Create supplier points from books, filter by status
      const supplierPoints = books
        .filter(book => book.seller?.location && book.quantity > 0 && statusFilters.includes(book.status))
        .map(book => ({
          id: book._id,
          name: book.seller.location.name,
          email: book.seller.email,
          phone: book.seller.phone,
          address: book.seller.location.address,
          latitude: book.seller.location.coordinates.latitude,
          longitude: book.seller.location.coordinates.longitude,
          price: book.price,
          quality: book.quality,
          quantity: book.quantity,
          status: book.status,
          bookId: book._id
        }));
      
      setSuppliers(supplierPoints);
    } catch (error) {
      console.error('Error fetching book suppliers:', error);
    } finally {
      setLoading(false);
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

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-geo-alt me-2"></i>
          Find "{bookTitle}" Near You
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner size="lg" />
            <p className="mt-3 text-muted">Finding suppliers...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h6 className="text-muted mb-3">
                Found {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} for this book
              </h6>
              
              {suppliers.length > 0 && (
                <Row className="mb-4">
                  {suppliers.slice(0, 3).map((supplier) => (
                    <Col md={4} key={supplier.id} className="mb-3">
                      <Card className="h-100 border-0 bg-light">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1 text-truncate">{supplier.name}</h6>
                            <Badge bg={getQualityBadge(supplier.quality)} className="text-capitalize">
                              {supplier.quality}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold text-success fs-5">{supplier.price}€</span>
                            <small className="text-muted">{supplier.quantity} in stock</small>
                          </div>
                          <div className="text-truncate">
                            <i className="bi bi-geo-alt me-1 text-muted"></i>
                            <small className="text-muted">{supplier.address}</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>

            <div style={{ height: '400px' }}>
              <LocationMap
                points={suppliers.map(supplier => ({
                  ...supplier,
                  // Custom popup data for book suppliers
                  totalOrders: null,
                  totalSpent: null,
                  lastOrder: null
                }))}
                type="suppliers"
                title="Book Suppliers"
                loading={loading}
              />
            </div>

            {suppliers.length === 0 && !loading && (
              <div className="text-center py-5">
                <i className="bi bi-search fs-1 text-muted mb-3"></i>
                <h5 className="text-muted mb-3">No suppliers found</h5>
                <p className="text-muted">
                  This book is currently not available from any suppliers in your area.
                </p>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {suppliers.length > 0 && (
          <Button variant="primary" onClick={() => window.location.href = '/marketplace'}>
            <i className="bi bi-shop me-2"></i>
            Browse All Books
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
