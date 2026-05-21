const { queryWithRole } = require('../config/db');

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function crearConsulta(req, res) {
  const { id_pac, id_med, id_est, fecha, motivo } = req.body || {};

  if (!isPositiveNumber(id_pac) || !isPositiveNumber(id_med) || !isPositiveNumber(id_est)) {
    return res.status(400).json({ message: 'Ids invalidos' });
  }

  if (!fecha || !motivo) {
    return res.status(400).json({ message: 'Fecha y motivo requeridos' });
  }

  try {
    await queryWithRole(
      req.user.dbRole,
      'CALL registrar_nueva_consulta($1, $2, $3, $4, $5)',
      [id_pac, id_med, id_est, fecha, motivo]
    );

    return res.status(201).json({ message: 'Consulta registrada' });
  } catch (err) {
    if (err.code === '42883') {
      try {
        await queryWithRole(
          req.user.dbRole,
          `INSERT INTO consultas (id_paciente, id_medico, id_estado, fecha_hora, motivo)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_pac, id_med, id_est, fecha, motivo]
        );

        return res.status(201).json({ message: 'Consulta registrada' });
      } catch (innerErr) {
        if (innerErr.code === '23505') {
          return res.status(409).json({ message: 'Medico con consulta en esa hora' });
        }
        return res.status(500).json({ message: 'Error al registrar consulta' });
      }
    }

    if (err.code === '23505' || err.code === 'P0001') {
      return res.status(409).json({ message: 'Medico con consulta en esa hora' });
    }

    return res.status(500).json({ message: 'Error al registrar consulta' });
  }
}

module.exports = {
  crearConsulta
};
