import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, sendSuccess } from '../utils/http.js';
import { getStats } from '../services/dashboardService.js';

export function dashboardRoutes(env) {
  const router = Router();
  router.get(
    '/stats',
    requireAuth(env),
    asyncHandler(async (req, res) => sendSuccess(res, { data: await getStats(req.user) })),
  );
  return router;
}
