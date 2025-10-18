// ==============================================================================
// BOOK CARD COMPONENT
// ==============================================================================
// Reusable card component for displaying book information
// Used in marketplace, seller listings, and book management pages
//
// Features:
// - Book cover image with fallback
// - Title, author, and description preview
// - Flexible action buttons (View, Edit, Delete)
// - Responsive card layout
// - Bootstrap styling integration
//
// Props:
// - book: Book object with title, author, description, coverUrl
// - onView: Required callback for viewing book details
// - onEdit: Optional callback for editing (sellers only)
// - onDelete: Optional callback for deleting (sellers only)
//
// Usage:
// ```jsx
// // Buyer view (view only)
// <BookCard book={book} onView={handleView} />
//
// // Seller view (full controls)
// <BookCard
//   book={book}
//   onView={handleView}
//   onEdit={handleEdit}
//   onDelete={handleDelete}
// />
// ```
// ==============================================================================

import Button from './Button';
import PropTypes from 'prop-types';

// ==============================================================================
// CONSTANTS
// ==============================================================================

/**
 * Maximum description length before truncation
 * @constant {number}
 */
const DESCRIPTION_MAX_LENGTH = 80;

/**
 * Default placeholder image path
 * @constant {string}
 */
const DEFAULT_COVER_IMAGE = '/assets/book-placeholder.png';

// ==============================================================================
// BOOK CARD COMPONENT
// ==============================================================================

/**
 * Book card component for marketplace and listings
 *
 * Displays book information in a card format with action buttons.
 * Conditionally shows Edit and Delete buttons if callbacks are provided.
 *
 * Card Structure:
 * - Cover image (top)
 * - Book information (middle)
 *   - Title (bold)
 *   - Author (muted)
 *   - Description (truncated)
 * - Action buttons (bottom)
 *   - View (always shown)
 *   - Edit (optional)
 *   - Delete (optional)
 *
 * @param {Object} props - Component props
 * @param {Object} props.book - Book data object
 * @param {string} props.book.title - Book title
 * @param {string} props.book.author - Book author
 * @param {string} [props.book.description] - Book description
 * @param {string} [props.book.coverUrl] - Cover image URL
 * @param {Function} props.onView - Callback when View button clicked
 * @param {Function} [props.onEdit] - Optional callback for Edit button
 * @param {Function} [props.onDelete] - Optional callback for Delete button
 * @returns {JSX.Element} Book card component
 *
 * @example
 * // Marketplace view (buyers)
 * <BookCard
 *   book={{
 *     title: 'The Great Gatsby',
 *     author: 'F. Scott Fitzgerald',
 *     description: 'A classic novel about...',
 *     coverUrl: 'https://...'
 *   }}
 *   onView={(book) => navigate(`/books/${book._id}`)}
 * />
 *
 * @example
 * // Seller management view
 * <BookCard
 *   book={book}
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export default function BookCard({ book, onEdit, onDelete, onView }) {
  /**
   * Get book cover image URL with fallback
   *
   * Returns book's coverUrl if available, otherwise returns default placeholder.
   * Ensures card always has an image even if book has no cover.
   *
   * @returns {string} Cover image URL
   */
  const getCoverImage = () => book.coverUrl || DEFAULT_COVER_IMAGE;

  /**
   * Get truncated book description
   *
   * Truncates description to DESCRIPTION_MAX_LENGTH characters and adds ellipsis.
   * Returns empty string if description is not available.
   *
   * @returns {string} Truncated description
   */
  const getTruncatedDescription = () => {
    if (!book.description) return '';
    return book.description.length > DESCRIPTION_MAX_LENGTH
      ? book.description.slice(0, DESCRIPTION_MAX_LENGTH) + '...'
      : book.description;
  };

  return (
    <div className="card book-card shadow-sm h-100">
      {/* Book Cover Image */}
      <img
        src={getCoverImage()}
        className="card-img-top"
        alt={`Cover of ${book.title}`}
        loading="lazy"
      />

      {/* Book Information */}
      <div className="card-body d-flex flex-column">
        {/* Book Title */}
        <h5 className="card-title">{book.title}</h5>

        {/* Book Author */}
        <p className="card-text text-muted mb-2">by {book.author}</p>

        {/* Book Description (truncated) */}
        <p className="card-text flex-grow-1">
          {getTruncatedDescription()}
        </p>

        {/* Action Buttons */}
        <div className="d-flex gap-2 mt-2">
          {/* View Button (always shown) */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onView(book)}
            aria-label={`View details for ${book.title}`}
          >
            View
          </Button>

          {/* Edit Button (optional - sellers only) */}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(book)}
              aria-label={`Edit ${book.title}`}
            >
              Edit
            </Button>
          )}

          {/* Delete Button (optional - sellers only) */}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// PROP TYPES
// ==============================================================================

/**
 * PropTypes for type checking and documentation
 *
 * Ensures component receives correct prop types and provides
 * helpful warnings in development if props are missing or wrong type.
 */
BookCard.propTypes = {
  /** Book data object */
  book: PropTypes.shape({
    /** Book title (required) */
    title: PropTypes.string.isRequired,
    /** Book author (required) */
    author: PropTypes.string.isRequired,
    /** Book description (optional) */
    description: PropTypes.string,
    /** Cover image URL (optional) */
    coverUrl: PropTypes.string,
  }).isRequired,

  /** Callback when View button is clicked (required) */
  onView: PropTypes.func.isRequired,

  /** Callback when Edit button is clicked (optional) */
  onEdit: PropTypes.func,

  /** Callback when Delete button is clicked (optional) */
  onDelete: PropTypes.func,
};
