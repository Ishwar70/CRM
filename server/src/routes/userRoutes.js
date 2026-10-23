import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { createUserBody, userStatusBody } from '../validators/users.js';

export function userRoutes(env) {
  const router = Router();
  router.use(requireAuth(env));

  router.get('/assignable', controller.listAssignable);

  router.use(requireRole('admin'));
  router.get('/', controller.listUsers);
  router.post('/', validate({ body: createUserBody }), controller.createUser);
  router.patch('/:id/status', validate({ params: idParams, body: userStatusBody }), controller.setUserStatus);

  return router;
}
