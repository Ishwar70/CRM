import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginBody } from '../validators/auth.js';

export function authRoutes(env) {
  const router = Router();
  const controller = authController(env);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.LOGIN_RATE_LIMIT,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' }),
  });

  router.post('/login', loginLimiter, validate({ body: loginBody }), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth(env), controller.me);

  return router;
}
