function authorize(allowedRoles = []) {
  const allowed = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!allowed.has(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    return next();
  };
}

module.exports = authorize;
