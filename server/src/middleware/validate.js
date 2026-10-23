import { ApiError } from '../utils/ApiError.js';

function formatIssues(issues) {
  return issues.map((issue) => {
    const field = issue.path.join('.') || (issue.keys?.length ? issue.keys.join(',') : 'request');
    return { field, message: issue.message };
  });
}

export function validate(schemas) {
  return (req, _res, next) => {
    const errors = [];
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        req[part] = result.data;
      } else {
        errors.push(...formatIssues(result.error.issues));
      }
    }
    if (errors.length) return next(ApiError.badRequest('Validation failed', errors));
    return next();
  };
}
