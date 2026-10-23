const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatCurrency = (value) => (value == null ? '—' : currency.format(value));
export const formatDate = (value) => (value ? date.format(new Date(value)) : '—');
