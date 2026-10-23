import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/http.js';

const USER_FIELDS = 'name email role';

export const isAdmin = (user) => user.role === 'admin';

/** Sales users can only ever see leads assigned to them. */
export function scopeFilter(user) {
  return isAdmin(user) ? {} : { assignedTo: user._id };
}

function populate(query) {
  return query.populate('assignedTo', USER_FIELDS).populate('createdBy', USER_FIELDS);
}

async function assertAssignable(userId) {
  const assignee = await User.findById(userId);
  if (!assignee || !assignee.isActive) {
    throw ApiError.badRequest('Validation failed', [
      { field: 'assignedTo', message: 'Assignee must be an active user' },
    ]);
  }
}

export async function listLeads(user, { search, status, priority, source, assignedTo, page, limit, sort }) {
  const filter = { ...scopeFilter(user) };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (source) filter.source = source;
  if (assignedTo && isAdmin(user)) filter.assignedTo = assignedTo;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { company: pattern }];
  }

  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');

  const [items, total] = await Promise.all([
    populate(
      Lead.find(filter)
        .sort({ [field]: direction, _id: direction })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Lead.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function findVisibleLead(user, id) {
  const lead = await Lead.findOne({ _id: id, ...scopeFilter(user) });
  // 404 (not 403) for other users' leads so Sales cannot probe which ids exist.
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
}

export async function getLead(user, id) {
  const lead = await findVisibleLead(user, id);
  return populate(Lead.findById(lead._id));
}

export async function createLead(user, body) {
  const data = { ...body, createdBy: user._id };
  if (isAdmin(user)) {
    data.assignedTo = body.assignedTo ?? user._id;
    if (body.assignedTo) await assertAssignable(body.assignedTo);
  } else {
    data.assignedTo = user._id;
  }
  const lead = await Lead.create(data);
  return populate(Lead.findById(lead._id));
}

export async function updateLead(user, id, body) {
  const lead = await findVisibleLead(user, id);
  if (body.assignedTo !== undefined && String(body.assignedTo) !== String(lead.assignedTo)) {
    if (!isAdmin(user)) throw ApiError.forbidden('Only admins can reassign leads');
    await assertAssignable(body.assignedTo);
  }
  lead.set(body);
  await lead.save();
  return populate(Lead.findById(lead._id));
}

export async function deleteLead(user, id) {
  if (!isAdmin(user)) throw ApiError.forbidden('Only admins can delete leads');
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw ApiError.notFound('Lead not found');
}
