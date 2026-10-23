import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status ?? 500;
  let message = err.message;
  let errors = err.errors;

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
    errors = undefined;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `A record with that ${field} already exists`;
    errors = [{ field, message }];
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (!(err instanceof ApiError) && status === 500) {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong';
  }

  const body = { success: false, message: message || 'Something went wrong' };
  if (Array.isArray(errors) && errors.length) body.errors = errors;
  res.status(status).json(body);
}
