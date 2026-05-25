const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,60}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const ROLE_TO_DB_ROLE = {
  ADMIN: 'rol_admin_sigeh',
  MEDICO: 'rol_medico_sigeh',
  USUARIO_GENERAL: 'rol_usuario_general_sigeh'
};

function normalizeUsername(value) {
  return String(value || '').trim();
}

function isValidLoginPayload(username, password) {
  return USERNAME_PATTERN.test(username)
    && typeof password === 'string'
    && password.trim().length >= PASSWORD_MIN_LENGTH
    && password.length <= PASSWORD_MAX_LENGTH;
}

function getRetryAfterSeconds(bloqueadoHasta) {
  if (!bloqueadoHasta) {
    return LOCKOUT_MINUTES * 60;
  }

  const remaining = new Date(bloqueadoHasta).getTime() - Date.now();
  return Math.max(1, Math.ceil(remaining / 1000));
}

async function writeBitacoraLogin({ userId = null, username, ipOrigen, tipoEvento, exito, descripcion = null }) {
  await pool.query(
    `INSERT INTO bitacora_accesos (id_usuario, username_intento, ip_origen, tipo_evento, exito, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, username, ipOrigen || null, tipoEvento, exito, descripcion]
  );
}

async function login(req, res) {
  const username = normalizeUsername(req.body && req.body.username);
  const password = req.body && req.body.password;

  if (!isValidLoginPayload(username, password)) {
    return res.status(400).json({ message: 'Credenciales requeridas' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.username, u.password_hash, u.bloqueado, u.bloqueado_hasta,
              u.intentos_fallidos, u.activo, u.id_medico, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.username = $1`,
      [username]
    );

    const ipOrigen = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

    if (result.rowCount === 0) {
      await writeBitacoraLogin({
        username,
        ipOrigen,
        tipoEvento: 'LOGIN_FAIL',
        exito: false,
        descripcion: 'Usuario no encontrado'
      });
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const user = result.rows[0];

    if (user.bloqueado && user.bloqueado_hasta) {
      const bloqueadoHasta = new Date(user.bloqueado_hasta);
      if (Number.isFinite(bloqueadoHasta.getTime()) && bloqueadoHasta.getTime() > Date.now()) {
        await writeBitacoraLogin({
          userId: user.id_usuario,
          username,
          ipOrigen,
          tipoEvento: 'BLOQUEO',
          exito: false,
          descripcion: 'Intento durante bloqueo temporal'
        });

        return res.status(423).json({
          message: 'Usuario bloqueado temporalmente',
          retry_after_seconds: getRetryAfterSeconds(bloqueadoHasta)
        });
      }

      await pool.query(
        `UPDATE usuarios
         SET intentos_fallidos = 0,
             bloqueado = FALSE,
             bloqueado_hasta = NULL
         WHERE id_usuario = $1`,
        [user.id_usuario]
      );

      user.bloqueado = false;
      user.bloqueado_hasta = null;
      user.intentos_fallidos = 0;
    }

    if (!user.activo || user.bloqueado) {
      return res.status(403).json({ message: 'Usuario bloqueado o inactivo' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const nextAttempts = Math.min(Number(user.intentos_fallidos || 0) + 1, MAX_LOGIN_ATTEMPTS);
      const shouldBlock = nextAttempts >= MAX_LOGIN_ATTEMPTS;
      const blockedUntil = shouldBlock ? new Date(Date.now() + (LOCKOUT_MINUTES * 60 * 1000)) : null;

      await pool.query(
        `UPDATE usuarios
         SET intentos_fallidos = $2,
             bloqueado = $3,
             bloqueado_hasta = $4
         WHERE id_usuario = $1`,
        [user.id_usuario, nextAttempts, shouldBlock, blockedUntil]
      );

      await writeBitacoraLogin({
        userId: user.id_usuario,
        username,
        ipOrigen,
        tipoEvento: shouldBlock ? 'BLOQUEO' : 'LOGIN_FAIL',
        exito: false,
        descripcion: shouldBlock ? 'Bloqueo temporal por intentos fallidos' : 'Contrasena invalida'
      });

      if (shouldBlock) {
        return res.status(423).json({
          message: 'Usuario bloqueado temporalmente',
          retry_after_seconds: LOCKOUT_MINUTES * 60
        });
      }

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
      `UPDATE usuarios
       SET intentos_fallidos = 0,
           bloqueado = FALSE,
           bloqueado_hasta = NULL,
           fecha_ultimo_acceso = NOW()
       WHERE id_usuario = $1`,
      [user.id_usuario]
    );

    await writeBitacoraLogin({
      userId: user.id_usuario,
      username: user.username,
      ipOrigen,
      tipoEvento: 'LOGIN_OK',
      exito: true,
      descripcion: 'Acceso correcto'
    });

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
