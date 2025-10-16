import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Modal as BootstrapModal } from 'react-bootstrap';
import { bookService } from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';

export default function BuyerBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    price: '',
    quantity: '',
    quality: 'good'
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getMyListings();
      setBooks(response.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: '',
      description: '',
      price: '',
      quantity: '',
      quality: 'good'
    });
    setEditingBook(null);
  };

  const handleAddBook = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditBook = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category || '',
      description: book.description,
      price: book.price.toString(),
      quantity: book.quantity.toString(),
      quality: book.quality
    });
    setEditingBook(book);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const bookData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      };

      if (editingBook) {
        await bookService.updateBook(editingBook._id, bookData);
      } else {
        await bookService.createBook(bookData);
      }

      setShowAddModal(false);
      resetForm();
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error saving book. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await bookService.deleteBook(bookId);
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error deleting book. Please try again.');
      }
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

  const getQualityIcon = (quality) => {
    const icons = {
      excellent: 'bi-star-fill',
      good: 'bi-hand-thumbs-up-fill',
      fair: 'bi-dash-circle-fill',
      poor: 'bi-exclamation-triangle-fill'
    };
    return icons[quality] || 'bi-question-circle';
  };

  // Filter and search logic
  const allCategories = ['all', ...new Set(books.map(b => b.category).filter(Boolean))];

  const filteredBooks = books.filter(book => {
    const matchesSearch = searchQuery === '' ||
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
    const matchesQuality = qualityFilter === 'all' || book.quality === qualityFilter;

    return matchesSearch && matchesCategory && matchesQuality;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setQualityFilter('all');
  };

  const bookStats = {
    total: books.length,
    inStock: books.filter(b => b.quantity > 0).length,
    lowStock: books.filter(b => b.quantity > 0 && b.quantity <= 5).length,
    outOfStock: books.filter(b => b.quantity === 0).length,
  };

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '1400px' }}>
      {/* Header with Stats */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">
                <i className="bi bi-bookshelf me-2 text-primary"></i>
                My Book Inventory
              </h1>
              <p className="text-muted mb-0">Manage your book listings and inventory</p>
            </div>
            <Button variant="primary" onClick={handleAddBook} size="lg">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Book
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      {books.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-books fs-4 text-primary"></i>
                </div>
                <div>
                  <div className="fs-4 fw-bold text-primary">{bookStats.total}</div>
                  <small className="text-muted">Total Books</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-check-circle fs-4 text-success"></i>
                </div>
                <div>
                  <div className="fs-4 fw-bold text-success">{bookStats.inStock}</div>
                  <small className="text-muted">In Stock</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-exclamation-triangle fs-4 text-warning"></i>
                </div>
                <div>
                  <div className="fs-4 fw-bold text-warning">{bookStats.lowStock}</div>
                  <small className="text-muted">Low Stock</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-x-circle fs-4 text-danger"></i>
                </div>
                <div>
                  <div className="fs-4 fw-bold text-danger">{bookStats.outOfStock}</div>
                  <small className="text-muted">Out of Stock</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {books.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <i className="bi bi-book display-1 text-muted mb-3"></i>
            <h3 className="text-muted mb-3">No books yet</h3>
            <p className="text-muted mb-4">Start building your inventory by adding your first book</p>
            <Button variant="primary" size="lg" onClick={handleAddBook}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Your First Book
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-center">
                {/* Search */}
                <Col xs={12} md={5}>
                  <div className="position-relative">
                    <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search books by title, author, or category..."
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

                {/* View Mode Toggle */}
                <Col xs={6} md={2}>
                  <div className="btn-group w-100" role="group">
                    <button
                      className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <i className="bi bi-grid-3x3-gap"></i>
                    </button>
                    <button
                      className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <i className="bi bi-list-ul"></i>
                    </button>
                  </div>
                </Col>

                {/* Filter Toggle */}
                <Col xs={6} md={2}>
                  <button
                    className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'} w-100`}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ borderRadius: '10px' }}
                  >
                    <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-2`}></i>
                    Filters
                    {(categoryFilter !== 'all' || qualityFilter !== 'all') && (
                      <Badge bg="light" text="primary" className="ms-2">
                        {(categoryFilter !== 'all' ? 1 : 0) + (qualityFilter !== 'all' ? 1 : 0)}
                      </Badge>
                    )}
                  </button>
                </Col>

                {/* Results */}
                <Col xs={12} md={3} className="text-md-end">
                  <div className="d-flex align-items-center justify-content-md-end gap-2">
                    <Badge bg="primary" className="py-2 px-3 fs-6">
                      {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
                    </Badge>
                    {(searchQuery || categoryFilter !== 'all' || qualityFilter !== 'all') && (
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

              {/* Filter Chips */}
              {showFilters && (
                <Row className="mt-3 pt-3 border-top">
                  <Col md={6}>
                    <small className="text-muted fw-semibold d-block mb-2">Category:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setCategoryFilter(cat)}
                          style={{ borderRadius: '20px', textTransform: 'capitalize' }}
                        >
                          {cat === 'all' ? 'All Categories' : cat || 'Uncategorized'}
                        </button>
                      ))}
                    </div>
                  </Col>
                  <Col md={6}>
                    <small className="text-muted fw-semibold d-block mb-2">Quality:</small>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className={`btn btn-sm ${qualityFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setQualityFilter('all')}
                        style={{ borderRadius: '20px' }}
                      >
                        All Qualities
                      </button>
                      {['excellent', 'good', 'fair', 'poor'].map(q => (
                        <button
                          key={q}
                          className={`btn btn-sm ${qualityFilter === q ? `btn-${getQualityBadge(q)}` : `btn-outline-${getQualityBadge(q)}`}`}
                          onClick={() => setQualityFilter(q)}
                          style={{ borderRadius: '20px', textTransform: 'capitalize' }}
                        >
                          <i className={`bi ${getQualityIcon(q)} me-1`}></i>
                          {q}
                        </button>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Empty State for Filtered Results */}
          {filteredBooks.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm animate-fade-in">
              <Card.Body>
                <i className="bi bi-filter-circle display-1 text-muted mb-3"></i>
                <h4 className="text-muted">No books match your filters</h4>
                <p className="text-muted mb-3">Try adjusting your search or filter criteria</p>
                <button className="btn btn-outline-primary" onClick={clearFilters}>
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Clear All Filters
                </button>
              </Card.Body>
            </Card>
          ) : (
            <Row className={viewMode === 'grid' ? 'g-4' : 'g-3'}>
              {filteredBooks.map((book, index) => (
                viewMode === 'grid' ? (
                  // Grid View - Modern Book Cards
                  <Col key={book._id} xs={12} sm={6} lg={4} xl={3}>
                    <Card className="h-100 border-0 shadow-sm book-card" style={{ transition: 'all 0.3s' }}>
                      <Card.Body className="d-flex flex-column">
                        {/* Book Icon/Cover */}
                        <div className="text-center mb-3">
                          <div className="bg-primary bg-opacity-10 rounded-3 p-4 d-inline-block">
                            <i className="bi bi-book display-4 text-primary"></i>
                          </div>
                        </div>

                        {/* Book Info */}
                        <div className="flex-grow-1">
                          <h5 className="fw-bold mb-2 text-truncate" title={book.title}>
                            {book.title}
                          </h5>
                          <p className="text-muted small mb-2">
                            <i className="bi bi-person me-1"></i>
                            {book.author}
                          </p>

                          {/* Category & Quality Badges */}
                          <div className="d-flex gap-2 mb-3 flex-wrap">
                            {book.category && (
                              <Badge bg="light" text="dark" className="text-capitalize">
                                <i className="bi bi-tag me-1"></i>
                                {book.category}
                              </Badge>
                            )}
                            <Badge bg={getQualityBadge(book.quality)} className="text-capitalize">
                              <i className={`bi ${getQualityIcon(book.quality)} me-1`}></i>
                              {book.quality}
                            </Badge>
                          </div>

                          {/* Description Preview */}
                          <p className="text-muted small mb-3" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {book.description}
                          </p>
                        </div>

                        {/* Price & Stock */}
                        <div className="border-top pt-3 mb-3">
                          <Row>
                            <Col>
                              <div className="text-center">
                                <div className="fs-4 fw-bold text-success">{book.price} MAD</div>
                                <small className="text-muted">Price</small>
                              </div>
                            </Col>
                            <Col>
                              <div className="text-center">
                                <div className={`fs-4 fw-bold ${book.quantity === 0 ? 'text-danger' : book.quantity <= 5 ? 'text-warning' : 'text-success'}`}>
                                  {book.quantity}
                                </div>
                                <small className="text-muted">In Stock</small>
                              </div>
                            </Col>
                          </Row>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => handleEditBook(book)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteBook(book._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  // List View - Compact Cards
                  <Col key={book._id} xs={12}>
                    <Card className="border-0 shadow-sm book-card-list" style={{ transition: 'all 0.2s' }}>
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col xs="auto">
                            <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                              <i className="bi bi-book fs-3 text-primary"></i>
                            </div>
                          </Col>
                          <Col xs={12} md={4}>
                            <h6 className="fw-bold mb-1">{book.title}</h6>
                            <small className="text-muted">
                              <i className="bi bi-person me-1"></i>
                              {book.author}
                            </small>
                          </Col>
                          <Col xs={6} md={2}>
                            {book.category && (
                              <Badge bg="light" text="dark" className="text-capitalize">
                                {book.category}
                              </Badge>
                            )}
                          </Col>
                          <Col xs={6} md={2}>
                            <Badge bg={getQualityBadge(book.quality)} className="text-capitalize">
                              <i className={`bi ${getQualityIcon(book.quality)} me-1`}></i>
                              {book.quality}
                            </Badge>
                          </Col>
                          <Col xs={6} md={1}>
                            <div className="fw-bold text-success">{book.price} MAD</div>
                          </Col>
                          <Col xs={6} md={1}>
                            <Badge bg={book.quantity === 0 ? 'danger' : book.quantity <= 5 ? 'warning' : 'success'}>
                              {book.quantity}
                            </Badge>
                          </Col>
                          <Col xs={12} md={2}>
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditBook(book)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteBook(book._id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              ))}
            </Row>
          )}
        </>
      )}

      {/* CSS Animations */}
      <style>{`
        .book-card {
          animation: fadeInUp 0.4s ease-out;
        }

        .book-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.15) !important;
        }

        .book-card-list:hover {
          transform: translateX(4px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12) !important;
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

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Staggered animation */
        ${filteredBooks.map((_, index) => `
          .book-card:nth-child(${index + 1}), .book-card-list:nth-child(${index + 1}) {
            animation-delay: ${index * 0.05}s;
          }
        `).join('\n')}
      `}</style>

      {/* Add/Edit Book Modal */}
      <BootstrapModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetForm();
        }}
        size="lg"
        centered
      >
        <BootstrapModal.Header closeButton className="border-0">
          <BootstrapModal.Title>
            <i className={`bi ${editingBook ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
            {editingBook ? 'Edit Book' : 'Add New Book'}
          </BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body className="px-4">
        <form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Input
                label="Book Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter book title"
              />
            </Col>
            <Col md={6}>
              <Input
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                placeholder="Enter author name"
              />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Fiction, Science, History"
              />
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <label className="form-label">Quality</label>
                <select
                  className="form-select"
                  name="quality"
                  value={formData.quality}
                  onChange={handleInputChange}
                  required
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </Col>
          </Row>

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Describe the book condition, content, etc."
          />

          <Row>
            <Col md={6}>
              <Input
                label="Price (MAD)"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder="0.00"
              />
            </Col>
            <Col md={6}>
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                placeholder="How many copies do you have?"
              />
            </Col>
          </Row>

        </form>
        </BootstrapModal.Body>
        <BootstrapModal.Footer className="border-0">
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={formLoading}
            disabled={formLoading}
            onClick={handleSubmit}
          >
            <i className={`bi ${editingBook ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
            {formLoading ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
          </Button>
        </BootstrapModal.Footer>
      </BootstrapModal>
    </Container>
  );
}
