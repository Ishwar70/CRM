import { useState } from 'react';
import { controlClasses } from '../../../components/ui/FormField.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { SearchIcon } from '../../../components/icons.jsx';
import { LEAD_PRIORITIES, LEAD_STATUSES, SORT_OPTIONS } from '../constants.js';

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select className={controlClasses} value={value} onChange={(e) => onChange(e.target.value)}>
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LeadFilters({ search, onSearchChange, filters, onFilterChange, onReset, assignees, canReset }) {
  const [open, setOpen] = useState(false);
  const activeCount = ['status', 'priority', 'assignedTo'].filter((k) => filters[k]).length;
  return (
    <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
      <label className="block sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block text-xs font-medium text-slate-600">Search</span>
        <span className="relative block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className={`${controlClasses} pl-9`}
            placeholder="Name, email or company"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </span>
      </label>
      <Button
        variant="secondary"
        className="md:hidden sm:col-span-2"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="lead-filter-controls"
      >
        {open ? 'Hide filters' : `Filters & sort${activeCount ? ` (${activeCount})` : ''}`}
      </Button>
      <div id="lead-filter-controls" className={`${open ? 'grid' : 'hidden'} gap-3 sm:col-span-2 sm:grid-cols-2 md:contents`}>
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => onFilterChange('status', v)}
          options={LEAD_STATUSES}
          allLabel="All statuses"
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(v) => onFilterChange('priority', v)}
          options={LEAD_PRIORITIES}
          allLabel="All priorities"
        />
        {assignees ? (
          <FilterSelect
            label="Assignee"
            value={filters.assignedTo}
            onChange={(v) => onFilterChange('assignedTo', v)}
            options={assignees.map((u) => ({ value: u._id, label: u.name }))}
            allLabel="All assignees"
          />
        ) : (
          <div className="hidden lg:block" />
        )}
        <FilterSelect label="Sort" value={filters.sort} onChange={(v) => onFilterChange('sort', v)} options={SORT_OPTIONS} />
        <Button variant="ghost" onClick={onReset} disabled={!canReset} className="sm:col-span-2 lg:col-span-1">
          Reset
        </Button>
      </div>
    </div>
  );
}
