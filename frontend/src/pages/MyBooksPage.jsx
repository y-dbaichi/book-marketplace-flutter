import BookCard from '../components/common/BookCard';
import Button from '../components/common/Button';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchMyBooks(true); // Show loading on initial load

    // Auto-refresh every 30 seconds to keep inventory up-to-date
    const refreshInterval = setInterval(() => {
      fetchMyBooks(false); // Don't show loading spinner on auto-refresh
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function fetchMyBooks(showLoadingSpinner = true) {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const res = await axios.get('/api/books/my');
      setBooks(res.data);
    } catch (err) {
      setBooks([]);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }

  const handleManualRefresh = () => {
    fetchMyBooks(false);
    setLastRefresh(Date.now());
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Books</h2>
          <small className="text-muted">
            <i className="bi bi-clock me-1"></i>
            Auto-refreshes every 30s • Last: {new Date(lastRefresh).toLocaleTimeString()}
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline" onClick={handleManualRefresh}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <Button variant="primary" href="/my-books/add">Add Book</Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">Loading your books...</div>
      ) : books.length === 0 ? (
        <div className="alert alert-info">You have not added any books yet.</div>
      ) : (
        <div className="row g-4">
          {books.map(book => (
            <div className="col-md-4 col-lg-3" key={book._id}>
              <BookCard book={book} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
