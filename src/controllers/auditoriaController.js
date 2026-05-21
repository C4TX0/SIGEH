const { queryWithRole } = require('../config/db');

async function getAccesos(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT b.id_bitacora,
              COALESCE(u.username, b.username_intento) AS username,
              b.username_intento,
              b.fecha_hora,
              b.ip_origen,
              b.tipo_evento,
              b.exito,
              b.descripcion
       FROM bitacora_accesos b
       LEFT JOIN usuarios u ON u.id_usuario = b.id_usuario
       ORDER BY b.fecha_hora DESC
       LIMIT 200`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar bitacora' });
  }
}

async function getCambios(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_auditoria, tabla_afectada, id_registro, campo_modificado,
              valor_anterior, valor_nuevo, id_usuario, fecha_hora, operacion
       FROM auditoria_cambios
       ORDER BY fecha_hora DESC
       LIMIT 200`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar auditoria de cambios' });
  }
}

module.exports = {
  getAccesos,
  getCambios
};
