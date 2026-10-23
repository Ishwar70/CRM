import { asyncHandler, sendSuccess } from '../utils/http.js';
import * as userService from '../services/userService.js';

export const listAssignable = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { users: await userService.listAssignable(req.user) } }),
);

export const listUsers = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { users: await userService.listUsers() } }),
);

export const createUser = asyncHandler(async (req, res) =>
  sendSuccess(res, { status: 201, data: { user: await userService.createUser(req.body) }, message: 'User created' }),
);

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.setUserStatus(req.user, req.params.id, req.body.isActive);
  return sendSuccess(res, { data: { user }, message: user.isActive ? 'User activated' : 'User deactivated' });
});
