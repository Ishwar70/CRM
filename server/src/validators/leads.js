import { z } from 'zod';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '../models/Lead.js';
import { objectId } from './common.js';

export const LEAD_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'company', 'status', 'priority', 'estimatedValue'];

const optionalText = (max, message) => z.string().trim().max(max, message);

const leadFields = {
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Invalid email').max(254)]),
  phone: optionalText(30, 'Phone must be at most 30 characters').regex(
    /^[0-9+()\-.\s]*$/,
    'Phone may only contain digits, spaces and + ( ) - .',
  ),
  company: optionalText(120, 'Company must be at most 120 characters'),
  source: z.enum(LEAD_SOURCES, { errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCES.join(', ')}` }) }),
  status: z.enum(LEAD_STATUSES, { errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUSES.join(', ')}` }) }),
  priority: z.enum(LEAD_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${LEAD_PRIORITIES.join(', ')}` }),
  }),
  estimatedValue: z
    .number({ invalid_type_error: 'Estimated value must be a number' })
    .min(0, 'Estimated value cannot be negative')
    .max(1_000_000_000, 'Estimated value is too large')
    .nullable(),
  notes: optionalText(2000, 'Notes must be at most 2000 characters'),
  assignedTo: objectId,
};

export const createLeadBody = z
  .object({
    ...Object.fromEntries(Object.entries(leadFields).map(([k, v]) => [k, v.optional()])),
    name: leadFields.name,
  })
  .strict();

export const updateLeadBody = z
  .object(Object.fromEntries(Object.entries(leadFields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

const sortValues = LEAD_SORT_FIELDS.flatMap((f) => [f, `-${f}`]);

export const listLeadsQuery = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    assignedTo: objectId.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(sortValues).default('-createdAt'),
  })
  .strict();
