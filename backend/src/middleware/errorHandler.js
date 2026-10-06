import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Interceptor]', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
      message: formattedErrors[0]?.message || 'Validation error',
    });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: `Duplicate entry: A record with this ${field} already exists.`,
      field,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid identifier format for ${err.path}.`,
    });
  }

  // Custom operational status or fallback to 500
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
