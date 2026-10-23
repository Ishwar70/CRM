import { Lead, LEAD_STATUSES } from '../models/Lead.js';
import { scopeFilter } from './leadService.js';

const OPEN_STATUSES = ['new', 'contacted', 'qualified'];

export async function getStats(user) {
  const match = scopeFilter(user);
  const [grouped, recentLeads] = await Promise.all([
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: { $ifNull: ['$estimatedValue', 0] } } } },
    ]),
    Lead.find(match).sort({ createdAt: -1, _id: -1 }).limit(5).populate('assignedTo', 'name email'),
  ]);

  const totals = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  let pipelineValue = 0;
  let wonValue = 0;
  for (const { _id: status, count, value } of grouped) {
    totals[status] = count;
    if (OPEN_STATUSES.includes(status)) pipelineValue += value;
    if (status === 'won') wonValue += value;
  }
  totals.total = grouped.reduce((sum, g) => sum + g.count, 0);

  return { totals, pipelineValue, wonValue, recentLeads };
}
