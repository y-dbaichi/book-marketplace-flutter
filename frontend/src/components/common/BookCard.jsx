import Button from './Button';

export default function BookCard({ book, onEdit, onDelete, onView }) {
  return (
    <div className="card book-card shadow-sm h-100">
      <img src={book.coverUrl || '/assets/book-placeholder.png'} className="card-img-top" alt={book.title} />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{book.title}</h5>
        <p className="card-text text-muted mb-2">{book.author}</p>
        <p className="card-text flex-grow-1">{book.description?.slice(0, 80)}...</p>
        <div className="d-flex gap-2 mt-2">
          <Button variant="primary" size="sm" onClick={() => onView(book)}>View</Button>
          {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(book)}>Edit</Button>}
          {onDelete && <Button variant="danger" size="sm" onClick={() => onDelete(book)}>Delete</Button>}
        </div>
      </div>
    </div>
  );
}
