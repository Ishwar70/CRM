import { Router } from 'express';
import * as controller from '../controllers/leadController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { createLeadBody, listLeadsQuery, updateLeadBody } from '../validators/leads.js';

export function leadRoutes(env) {
  const router = Router();
  router.use(requireAuth(env));

  router.get('/', validate({ query: listLeadsQuery }), controller.listLeads);
  router.post('/', validate({ body: createLeadBody }), controller.createLead);
  router.get('/:id', validate({ params: idParams }), controller.getLead);
  router.patch('/:id', validate({ params: idParams, body: updateLeadBody }), controller.updateLead);
  router.delete('/:id', requireRole('admin'), validate({ params: idParams }), controller.deleteLead);

  return router;
}
