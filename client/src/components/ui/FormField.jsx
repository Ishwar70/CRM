import { forwardRef, useId } from 'react';

const controlClasses =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:ring-rose-500';

function Field({ label, error, hint, id, required, children }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-rose-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({ describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required}>
      {({ describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`${controlClasses} ${className}`}
          {...props}
        />
      )}
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, required, options, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required}>
      {({ describedBy, invalid }) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${controlClasses} ${className}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className = '', ...props }, ref) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required}>
      {({ describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${controlClasses} ${className}`}
          {...props}
        />
      )}
    </Field>
  );
});

export { controlClasses };
