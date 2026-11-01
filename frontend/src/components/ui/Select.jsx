import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', containerClassName = '', id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={['input cursor-pointer pr-8', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === 'object' ? option.value ?? option.key : option;
          const text = typeof option === 'object' ? option.label : option;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export default Select;
