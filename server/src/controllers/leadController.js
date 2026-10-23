import { asyncHandler, sendSuccess } from '../utils/http.js';
import * as leadService from '../services/leadService.js';

export const listLeads = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: await leadService.listLeads(req.user, req.query) }),
);

export const getLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { lead: await leadService.getLead(req.user, req.params.id) } }),
);

export const createLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { status: 201, data: { lead: await leadService.createLead(req.user, req.body) }, message: 'Lead created' }),
);

export const updateLead = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: { lead: await leadService.updateLead(req.user, req.params.id, req.body) },
    message: 'Lead updated',
  }),
);

export const deleteLead = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.user, req.params.id);
  return sendSuccess(res, { message: 'Lead deleted' });
});
