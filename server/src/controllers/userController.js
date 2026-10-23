import { asyncHandler, sendSuccess } from '../utils/http.js';
import * as userService from '../services/userService.js';

export const listAssignable = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { users: await userService.listAssignable(req.user) } }),
);
