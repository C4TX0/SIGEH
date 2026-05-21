const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const ROLE_TO_DB_ROLE = {
  ADMIN: 'rol_admin_sigeh',
  MEDICO: 'rol_medico_sigeh',
  USUARIO_GENERAL: 'rol_usuario_general_sigeh'
};

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Credenciales requeridas' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.username, u.password_hash, u.bloqueado, u.activo,
              u.id_medico, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.username = $1`,
      [username]
    );

    const ipOrigen = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

    if (result.rowCount === 0) {
      await pool.query(
        `INSERT INTO bitacora_accesos (username_intento, ip_origen, tipo_evento, exito)
         VALUES ($1, $2, 'LOGIN_FAIL', FALSE)`,
        [username, ipOrigen || null]
      );
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const user = result.rows[0];

    if (!user.activo || user.bloqueado) {
      return res.status(403).json({ message: 'Usuario bloqueado o inactivo' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await pool.query(
        `INSERT INTO bitacora_accesos (id_usuario, username_intento, ip_origen, tipo_evento, exito)
         VALUES ($1, $2, $3, 'LOGIN_FAIL', FALSE)`,
        [user.id_usuario, username, ipOrigen || null]
      );
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const dbRole = ROLE_TO_DB_ROLE[user.rol];
    if (!dbRole) {
      return res.status(403).json({ message: 'Rol sin mapeo de base de datos' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET no configurado' });
    }

    const token = jwt.sign(
      {
        sub: user.id_usuario,
        username: user.username,
        role: user.rol,
        dbRole,
        id_medico: user.id_medico
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await pool.query(
      `INSERT INTO bitacora_accesos (id_usuario, username_intento, ip_origen, tipo_evento, exito)
       VALUES ($1, $2, $3, 'LOGIN_OK', TRUE)`,
      [user.id_usuario, user.username, ipOrigen || null]
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({
      message: 'Error en autenticacion',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

module.exports = {
  login
};
