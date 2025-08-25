import BookCard from '../components/common/BookCard';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MarketplacePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const res = await axios.get('/api/books');
        setBooks(res.data);
      } catch (err) {
        setBooks([]);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Marketplace</h2>
      {loading ? (
        <div className="text-center py-5">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="alert alert-info">No books found. Be the first to add one!</div>
      ) : (
        <div className="row g-4">
          {books.map(book => (
            <div className="col-md-4 col-lg-3" key={book._id}>
              <BookCard book={book} onView={() => {}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
