import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className,
  type = 'text',
  ...props
}, ref) => {
  const inputClasses = clsx(
    'form-control',
    {
      'is-invalid': error,
    },
    className
  );

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />

      {error && (
        <div className="invalid-feedback">
          {error}
        </div>
      )}

      {helperText && !error && (
        <div className="form-text">
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
