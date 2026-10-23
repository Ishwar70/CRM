import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { AUTH_COOKIE, clearAuthCookie, verifyToken } from '../services/authService.js';

export function requireAuth(env) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[AUTH_COOKIE];
      if (!token) throw ApiError.unauthorized();

      let payload;
      try {
        payload = verifyToken(token, env);
      } catch {
        throw ApiError.unauthorized('Session expired or invalid. Please sign in again.');
      }

      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        clearAuthCookie(res, env);
        throw ApiError.unauthorized('Session expired or invalid. Please sign in again.');
      }

      req.user = user;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };
}
