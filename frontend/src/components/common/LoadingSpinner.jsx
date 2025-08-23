export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: { width: '1rem', height: '1rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '3rem', height: '3rem' },
    xl: { width: '4rem', height: '4rem' }
  };

  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`}>
      <div
        className="spinner-border text-primary"
        role="status"
        style={sizes[size]}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

// Full page loading component
export function PageLoader() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-muted">Loading...</p>
      </div>
    </div>
  );
}
