export default (path, middleware) =>
  (req, res, next) =>
    path === req.path
      ? next()
      : middleware(req, res, next)
