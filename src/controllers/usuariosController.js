const bcrypt = require('bcrypt');
const { queryWithRole } = require('../config/db');

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function listUsuarios(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT u.id_usuario, u.username, u.id_rol, r.nombre AS rol,
              u.id_medico, u.intentos_fallidos, u.bloqueado, u.activo,
              u.fecha_ultimo_acceso
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       ORDER BY u.id_usuario`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar usuarios' });
  }
}

async function getUsuarioById(req, res) {
  const id = Number(req.params.id);
  if (!isPositiveNumber(id)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT u.id_usuario, u.username, u.id_rol, r.nombre AS rol,
              u.id_medico, u.intentos_fallidos, u.bloqueado, u.activo,
              u.fecha_ultimo_acceso
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar usuario' });
  }
}

async function createUsuario(req, res) {
  const { username, password, id_rol, id_medico } = req.body || {};

  if (!username || !password || !id_rol) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  if (!isPositiveNumber(Number(id_rol))) {
    return res.status(400).json({ message: 'Rol invalido' });
  }

  if (id_medico !== undefined && id_medico !== null && !isPositiveNumber(Number(id_medico))) {
    return res.status(400).json({ message: 'Medico invalido' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await queryWithRole(
      req.user.dbRole,
      `INSERT INTO usuarios (username, password_hash, id_rol, id_medico)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario`,
      [username, passwordHash, id_rol, id_medico || null]
    );

    return res.status(201).json({ id_usuario: result.rows[0].id_usuario });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username ya registrado' });
    }
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
}

async function updateUsuario(req, res) {
  const id = Number(req.params.id);
  if (!isPositiveNumber(id)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  const fields = {
    username: req.body.username,
    id_rol: req.body.id_rol,
    id_medico: req.body.id_medico,
    bloqueado: req.body.bloqueado,
    activo: req.body.activo
  };

  if (fields.id_rol !== undefined && fields.id_rol !== null) {
    if (!isPositiveNumber(Number(fields.id_rol))) {
      return res.status(400).json({ message: 'Rol invalido' });
    }
  }

  if (fields.id_medico !== undefined && fields.id_medico !== null) {
    if (!isPositiveNumber(Number(fields.id_medico))) {
      return res.status(400).json({ message: 'Medico invalido' });
    }
  }

  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0 && !req.body.password) {
    return res.status(400).json({ message: 'Sin cambios para actualizar' });
  }

  const setClauses = keys.map((k, idx) => `${k} = $${idx + 1}`);
  const values = keys.map((k) => fields[k]);

  if (req.body.password) {
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    setClauses.push(`password_hash = $${setClauses.length + 1}`);
    values.push(passwordHash);
  }

  values.push(id);

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id_usuario = $${values.length} RETURNING id_usuario`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ id_usuario: result.rows[0].id_usuario });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username ya registrado' });
    }
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
}

async function deleteUsuario(req, res) {
  const id = Number(req.params.id);
  if (!isPositiveNumber(id)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'DELETE FROM usuarios WHERE id_usuario = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario eliminado' });
  } catch (err) {
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
}

module.exports = {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
