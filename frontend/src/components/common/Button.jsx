import { forwardRef } from 'react';
import clsx from 'clsx';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = '',
  disabled = false,
  loading = false,
  className,
  ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-primary',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning',
    info: 'btn-info',
    light: 'btn-light',
    dark: 'btn-dark'
  };

  const sizes = {
    sm: 'btn-sm',
    lg: 'btn-lg'
  };

  const classes = clsx(
    'btn',
    variants[variant],
    size && sizes[size],
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="loading-spinner me-2"></span>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
