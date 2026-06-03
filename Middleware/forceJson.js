const forceJsonResponse = (req, res, next) => {
    req.query.format = 'json';
    req.headers.accept = 'application/json';
    next();
  };

  module.exports={
    forceJsonResponse
  }