export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function sendSuccess(res, { status = 200, data = null, message } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
