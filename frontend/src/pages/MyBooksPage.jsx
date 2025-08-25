import BookCard from '../components/common/BookCard';
import Button from '../components/common/Button';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyBooks() {
      setLoading(true);
      try {
        const res = await axios.get('/api/books/my');
        setBooks(res.data);
      } catch (err) {
        setBooks([]);
      }
      setLoading(false);
    }
    fetchMyBooks();
  }, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">My Books</h2>
        <Button variant="primary" href="/my-books/add">Add Book</Button>
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
