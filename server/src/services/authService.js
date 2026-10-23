import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const AUTH_COOKIE = 'crm_token';
const INVALID_CREDENTIALS = 'Invalid email or password';

export async function authenticate(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email, wrong password and inactive account to avoid account enumeration.
  if (!user || !(await user.verifyPassword(password)) || !user.isActive) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }
  return user;
}

export function signToken(user, env) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token, env) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function cookieOptions(env) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    // Cross-site deployments (separate client/API domains) require SameSite=None + Secure.
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookie(res, token, env) {
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(env), maxAge: exp * 1000 - Date.now() });
}

export function clearAuthCookie(res, env) {
  res.clearCookie(AUTH_COOKIE, cookieOptions(env));
}
