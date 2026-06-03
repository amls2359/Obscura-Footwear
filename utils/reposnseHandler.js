const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const wantsJsonResponse = (req) => {
  if (req.query.format === 'json') {
    return true;
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return true;
  }

  if (req.headers['content-type']?.includes('application/json')) {
    return true;
  }

  if (
    req.xhr ||
    (req.headers['x-requested-with'] &&
      req.headers['x-requested-with'] === 'XMLHttpRequest')
  ) {
    return true;
  }

  // if (req.headers['x-api-request'] === 'true') {
  //   return true;
  // }

  // if (req.path && req.path.startsWith('/api/')) {
  //   return true;
  // }

  // if (req.originalUrl && req.originalUrl.includes('/api/')) {
  //   return true;
  // }

  return false;
};

module.exports = {
  successResponse,
  errorResponse,
  wantsJsonResponse,
};
