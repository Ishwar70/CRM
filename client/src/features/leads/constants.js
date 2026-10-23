export const LEAD_STATUSES = [
  { value: 'new', label: 'New', className: 'bg-sky-50 text-sky-700 ring-sky-600/20', bar: 'bg-sky-500' },
  { value: 'contacted', label: 'Contacted', className: 'bg-violet-50 text-violet-700 ring-violet-600/20', bar: 'bg-violet-500' },
  { value: 'qualified', label: 'Qualified', className: 'bg-amber-50 text-amber-800 ring-amber-600/20', bar: 'bg-amber-500' },
  { value: 'won', label: 'Won', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', bar: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', className: 'bg-slate-100 text-slate-600 ring-slate-500/20', bar: 'bg-slate-400' },
];

export const LEAD_PRIORITIES = [
  { value: 'low', label: 'Low', className: 'text-slate-600', dot: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', className: 'text-amber-700', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', className: 'text-rose-700', dot: 'bg-rose-500' },
];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
];

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
  { value: '-estimatedValue', label: 'Highest value' },
  { value: '-updatedAt', label: 'Recently updated' },
];

export const PAGE_SIZE = 10;

export const findOption = (options, value) => options.find((o) => o.value === value);
