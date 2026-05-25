const { queryWithRole } = require('../config/db');

function isValidCurp(curp) {
  return typeof curp === 'string' && curp.length === 18;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function createPaciente(req, res) {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    curp,
    telefono,
    correo_electronico,
    id_tipo_sangre,
    alergias
  } = req.body || {};

  if (!nombre || !apellido_paterno || !fecha_nacimiento || !curp) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  if (!isValidCurp(curp)) {
    return res.status(400).json({ message: 'CURP invalida' });
  }

  if (id_tipo_sangre !== undefined && id_tipo_sangre !== null && !isPositiveNumber(id_tipo_sangre)) {
    return res.status(400).json({ message: 'Tipo de sangre invalido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `INSERT INTO pacientes (
         nombre,
         apellido_paterno,
         apellido_materno,
         fecha_nacimiento,
         curp,
         telefono,
         correo_electronico,
         id_tipo_sangre,
         alergias
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id_paciente`,
      [
        nombre,
        apellido_paterno,
        apellido_materno || null,
        fecha_nacimiento,
        curp,
        telefono || null,
        correo_electronico || null,
        id_tipo_sangre || null,
        alergias || null
      ]
    );

    return res.status(201).json({ id_paciente: result.rows[0].id_paciente });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Paciente ya registrado' });
    }
    return res.status(500).json({ message: 'Error al registrar paciente' });
  }
}

async function getPacienteById(req, res) {
  const id = Number(req.params.id);
  if (!isPositiveNumber(id)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT * FROM pacientes WHERE id_paciente = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar paciente' });
  }
}

async function getPacientes(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT * FROM pacientes ORDER BY id_paciente'
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar pacientes' });
  }
}

async function buscarPacientes(req, res) {
  const term = (req.query.q || '').trim();

  if (!term) {
    return res.status(400).json({ message: 'Parametro de busqueda requerido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_paciente, nombre, apellido_paterno, apellido_materno, curp
       FROM pacientes
       WHERE CAST(id_paciente AS TEXT) ILIKE $1
          OR nombre ILIKE $1
          OR apellido_paterno ILIKE $1
          OR apellido_materno ILIKE $1
          OR curp ILIKE $1
       ORDER BY id_paciente
       LIMIT 8`,
      [`%${term}%`]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al buscar pacientes' });
  }
}

async function updatePaciente(req, res) {
  const id = Number(req.params.id);
  if (!isPositiveNumber(id)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  const allowedFields = {
    nombre: req.body.nombre,
    apellido_paterno: req.body.apellido_paterno,
    apellido_materno: req.body.apellido_materno,
    fecha_nacimiento: req.body.fecha_nacimiento,
    curp: req.body.curp,
    telefono: req.body.telefono,
    correo_electronico: req.body.correo_electronico,
    id_tipo_sangre: req.body.id_tipo_sangre,
    alergias: req.body.alergias,
    activo: req.body.activo
  };

  if (allowedFields.curp && !isValidCurp(allowedFields.curp)) {
    return res.status(400).json({ message: 'CURP invalida' });
  }

  if (allowedFields.id_tipo_sangre !== undefined && allowedFields.id_tipo_sangre !== null) {
    if (!isPositiveNumber(Number(allowedFields.id_tipo_sangre))) {
      return res.status(400).json({ message: 'Tipo de sangre invalido' });
    }
  }

  const keys = Object.keys(allowedFields).filter((k) => allowedFields[k] !== undefined);
  if (keys.length === 0) {
    return res.status(400).json({ message: 'Sin cambios para actualizar' });
  }

  const setClauses = keys.map((k, idx) => `${k} = $${idx + 1}`);
  const values = keys.map((k) => allowedFields[k]);
  values.push(id);

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `UPDATE pacientes SET ${setClauses.join(', ')} WHERE id_paciente = $${values.length} RETURNING id_paciente`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    return res.status(200).json({ id_paciente: result.rows[0].id_paciente });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'CURP ya registrada' });
    }
    return res.status(500).json({ message: 'Error al actualizar paciente' });
  }
}

module.exports = {
  createPaciente,
  buscarPacientes,
  getPacientes,
  getPacienteById,
  updatePaciente
};
