import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, hint, icon: Icon, className = '', containerClassName = '', id, ...rest }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />}
        <input
          ref={ref}
          id={inputId}
          className={['input', Icon ? 'pl-9' : '', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
          {...rest}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
});

export default Input;
