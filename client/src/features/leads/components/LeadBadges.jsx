import { findOption, LEAD_PRIORITIES, LEAD_STATUSES } from '../constants.js';

export function StatusBadge({ status }) {
  const option = findOption(LEAD_STATUSES, status);
  if (!option) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${option.className}`}>
      {option.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const option = findOption(LEAD_PRIORITIES, priority);
  if (!option) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${option.className}`}>
      <span className={`h-2 w-2 rounded-full ${option.dot}`} aria-hidden="true" />
      {option.label}
    </span>
  );
}
