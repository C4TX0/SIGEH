const jwt = require('jsonwebtoken');

const ALLOWED_DB_ROLES = new Set([
  'rol_medico_sigeh',
  'rol_admin_sigeh',
  'rol_usuario_general_sigeh'
]);

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.dbRole || !ALLOWED_DB_ROLES.has(payload.dbRole)) {
      return res.status(403).json({ message: 'Rol invalido' });
    }

    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      dbRole: payload.dbRole,
      id_medico: payload.id_medico
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalido' });
  }
}

module.exports = auth;
