import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

export function userRoutes(env) {
  const router = Router();
  router.use(requireAuth(env));

  router.get('/assignable', controller.listAssignable);

  return router;
}
