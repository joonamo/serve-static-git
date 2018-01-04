export default (method, path, middleware) =>
  (req, res, next) =>
    req.method === 'POST' && path === req.path
      ? next()
      : middleware(req, res, next)
