import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import BookCard from '../BookCard';

describe('BookCard Component', () => {
  const mockBook = {
    _id: '1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description: 'A handbook of agile software craftsmanship that will help you write better code',
    coverUrl: null,
    price: 150,
    quality: 'excellent'
  };

  it('renders book title and author', () => {
    const onView = vi.fn();
    renderWithProviders(<BookCard book={mockBook} onView={onView} />);

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(mockBook.author)).toBeInTheDocument();
  });

  it('displays truncated description with ellipsis', () => {
    const onView = vi.fn();
    renderWithProviders(<BookCard book={mockBook} onView={onView} />);

    const description = screen.getByText(/A handbook of agile software craftsmanship/);
    expect(description.textContent).toContain('...');
  });

  it('shows placeholder image when coverUrl is not provided', () => {
    const onView = vi.fn();
    renderWithProviders(<BookCard book={mockBook} onView={onView} />);

    const image = screen.getByAltText(mockBook.title);
    expect(image).toHaveAttribute('src', '/assets/book-placeholder.png');
  });

  it('shows book cover when coverUrl is provided', () => {
    const onView = vi.fn();
    const bookWithCover = { ...mockBook, coverUrl: '/images/book.jpg' };

    renderWithProviders(<BookCard book={bookWithCover} onView={onView} />);

    const image = screen.getByAltText(mockBook.title);
    expect(image).toHaveAttribute('src', '/images/book.jpg');
  });

  it('renders View button', () => {
    const onView = vi.fn();
    renderWithProviders(<BookCard book={mockBook} onView={onView} />);

    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('calls onView when View button is clicked', () => {
    const onView = vi.fn();
    renderWithProviders(<BookCard book={mockBook} onView={onView} />);

    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith(mockBook);
  });

  it('renders Edit button when onEdit is provided', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} onEdit={onEdit} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('does not render Edit button when onEdit is not provided', () => {
    const onView = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} />);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('renders Delete button when onDelete is provided', () => {
    const onView = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} onDelete={onDelete} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render Delete button when onDelete is not provided', () => {
    const onView = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} />);
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockBook);
  });

  it('calls onDelete when Delete button is clicked', () => {
    const onView = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(<BookCard book={mockBook} onView={onView} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(mockBook);
  });

  it('handles book without description', () => {
    const onView = vi.fn();
    const bookNoDesc = { ...mockBook, description: undefined };

    renderWithProviders(<BookCard book={bookNoDesc} onView={onView} />);
    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
  });
});
