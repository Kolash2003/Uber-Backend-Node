class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const notFound = (req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[error]', err);
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
};

module.exports = { HttpError, asyncHandler, notFound, errorHandler };