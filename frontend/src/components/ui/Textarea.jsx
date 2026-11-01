import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, hint, rows = 4, className = '', containerClassName = '', id, ...rest }, ref) {
  const autoId = useId();
  const textareaId = id || autoId;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={['input resize-y', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
});

export default Textarea;
