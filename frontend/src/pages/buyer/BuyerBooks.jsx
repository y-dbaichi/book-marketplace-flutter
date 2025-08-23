import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { bookService } from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
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

  if (loading) {
    return (
      <Container className="py-5">
        <LoadingSpinner size="lg" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <i className="bi bi-book me-2"></i>
            My Book Inventory
          </h1>
          <p className="text-muted mb-0">Manage your book listings and inventory</p>
        </div>
        <Button variant="primary" onClick={handleAddBook}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Book
        </Button>
      </div>

      {books.length === 0 ? (
        <Card className="text-center p-5">
          <i className="bi bi-book fs-1 text-muted mb-3"></i>
          <h3 className="text-muted mb-3">No books yet</h3>
          <p className="text-muted mb-4">Start building your inventory by adding your first book</p>
          <Button variant="primary" onClick={handleAddBook}>
            <i className="bi bi-plus-circle me-2"></i>
            Add Your First Book
          </Button>
        </Card>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Book Details</th>
                  <th>Category</th>
                  <th>Quality</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <div>
                        <h6 className="mb-1">{book.title}</h6>
                        <small className="text-muted">by {book.author}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {book.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <Badge bg={getQualityBadge(book.quality)} className="text-capitalize">
                        {book.quality}
                      </Badge>
                    </td>
                    <td>
                      <span className="fw-bold text-success">{book.price}€</span>
                    </td>
                    <td>
                      <span className={`badge ${book.quantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                        {book.quantity} in stock
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBook(book)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteBook(book._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Book Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
      >
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
                label="Price (€)"
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

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
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
            >
              {formLoading ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
            </Button>
          </div>
        </form>
      </Modal>
    </Container>
  );
}
