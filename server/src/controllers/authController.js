import { asyncHandler, sendSuccess } from '../utils/http.js';
import { authenticate, clearAuthCookie, setAuthCookie, signToken } from '../services/authService.js';

export function authController(env) {
  return {
    login: asyncHandler(async (req, res) => {
      const user = await authenticate(req.body.email, req.body.password);
      setAuthCookie(res, signToken(user, env), env);
      return sendSuccess(res, { data: { user }, message: 'Signed in' });
    }),

    logout: (req, res) => {
      clearAuthCookie(res, env);
      return sendSuccess(res, { message: 'Signed out' });
    },

    me: (req, res) => sendSuccess(res, { data: { user: req.user } }),
  };
}
