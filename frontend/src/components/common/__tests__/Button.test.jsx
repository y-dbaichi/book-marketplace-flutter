import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant class correctly', () => {
    renderWithProviders(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('btn-danger');
  });

  it('applies size class correctly', () => {
    renderWithProviders(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toHaveClass('btn-sm');
  });

  it('disables button when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button disabled onClick={handleClick}>Disabled</Button>);

    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    renderWithProviders(<Button className="custom-class">Button</Button>);
    expect(screen.getByText('Button')).toHaveClass('custom-class');
    expect(screen.getByText('Button')).toHaveClass('btn'); // Still has base class
  });

  it('disables button when loading', () => {
    renderWithProviders(<Button loading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeDisabled();
  });

  it('applies all variant options', () => {
    const variants = [
      { variant: 'primary', className: 'btn-primary' },
      { variant: 'secondary', className: 'btn-secondary' },
      { variant: 'outline', className: 'btn-outline-primary' },
      { variant: 'danger', className: 'btn-danger' },
      { variant: 'success', className: 'btn-success' },
      { variant: 'warning', className: 'btn-warning' },
      { variant: 'info', className: 'btn-info' }
    ];

    variants.forEach(({ variant, className }) => {
      const { unmount } = renderWithProviders(<Button variant={variant}>Test</Button>);
      const button = screen.getByText('Test');
      expect(button).toHaveClass(className);
      unmount();
    });
  });
});
