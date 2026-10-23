import { z } from 'zod';

const statuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
const priorities = ['low', 'medium', 'high'];
const sources = ['website', 'referral', 'linkedin', 'other'];

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be at most 30 characters')
    .regex(/^[0-9+()\-.\s]*$/, 'Use digits, spaces and + ( ) - . only'),
  company: z.string().trim().max(120, 'Company must be at most 120 characters'),
  source: z.enum(sources),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  estimatedValue: z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a non-negative number'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  assignedTo: z.string(),
});

export const emptyLead = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'website',
  status: 'new',
  priority: 'medium',
  estimatedValue: '',
  notes: '',
  assignedTo: '',
};

export function leadToForm(lead) {
  return {
    name: lead.name ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    company: lead.company ?? '',
    source: lead.source ?? 'other',
    status: lead.status ?? 'new',
    priority: lead.priority ?? 'medium',
    estimatedValue: lead.estimatedValue == null ? '' : String(lead.estimatedValue),
    notes: lead.notes ?? '',
    assignedTo: lead.assignedTo?._id ?? '',
  };
}

export function formToPayload(values, { isAdmin }) {
  const { assignedTo, estimatedValue, ...rest } = values;
  const payload = { ...rest, estimatedValue: estimatedValue === '' ? null : Number(estimatedValue) };
  if (isAdmin && assignedTo) payload.assignedTo = assignedTo;
  return payload;
}
